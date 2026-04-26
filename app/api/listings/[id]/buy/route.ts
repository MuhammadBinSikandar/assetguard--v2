import { NextRequest, NextResponse } from 'next/server';
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
  getMint,
} from '@solana/spl-token';
import prisma from '@/db/prismaClient';
import { getUserFromAccessToken } from '@/lib/auth';
import { getAdminKeypair, getSolanaRpcUrl } from '@/lib/solana/admin-keypair';
import { resolveCustodyForTransfer } from '@/lib/solana/listing-custody';
import { getSolPriceUsd } from '@/lib/solana/get-sol-price';
import {
  verifyBuyerToAdminTransferAndGetAmount,
} from '@/lib/solana/verify-escrow-sol';
import { tryRefundLamportsToBuyer } from '@/lib/solana/refund-buyer-sol';
import { sendEmail } from '@/lib/email';
import { apiLogger } from '@/lib/debug-logger';
import { ListingStatus, PurchaseStatus } from '@prisma/client';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RouteContext = { params: Promise<{ id: string }> };

function solToLamports(sol: number): bigint {
  return BigInt(Math.max(0, Math.round(sol * Number(LAMPORTS_PER_SOL))));
}

/**
 * Token movement (see `resolveCustodyForTransfer` in `lib/solana/listing-custody.ts`):
 * - **Delegate path:** Seller’s ATA has approved the admin as delegate for ≥ this purchase size.
 * - **Admin ATA path:** The admin’s ATA for this mint has enough balance (escrowed tokens).
 * Otherwise the flow fails and the DB reservation is rolled back.
 * Sellers set up the delegate in “My Listings” / create-listing, or an operator moves tokens to admin.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const { id: listingId } = await context.params;
  let reserved = false;
  let reservedQty = 0;
  let tokenComplete = false;
  let releaseComplete = false;
  /** Set after admin keypair loads; used for custody error details. */
  let escrowAdminAddress: string | undefined;
  /** Lamports received from buyer after payment is verified; used for automatic refunds. */
  let receivedLamports: bigint | null = null;
  let buyerPub: PublicKey | null = null;

  try {
    apiLogger.request('POST', `/api/listings/${listingId}/buy`);

    if (!listingId || !UUID_RE.test(listingId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid listing id.' },
        { status: 400 },
      );
    }

    const decoded = await getUserFromAccessToken();
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Please log in.' },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => null);
    const tBuy =
      typeof body?.tokensToBuy === 'number' && Number.isInteger(body.tokensToBuy) && body.tokensToBuy > 0
        ? body.tokensToBuy
        : null;
    const buyerWallet = typeof body?.buyerWallet === 'string' ? body.buyerWallet.trim() : null;
    const solTransferTxHash =
      typeof body?.solTransferTxHash === 'string' ? body.solTransferTxHash.trim() : null;

    if (!tBuy || !buyerWallet || !solTransferTxHash) {
      return NextResponse.json(
        { success: false, message: 'Body must include tokensToBuy, buyerWallet, and solTransferTxHash.' },
        { status: 400 },
      );
    }

    try {
      buyerPub = new PublicKey(buyerWallet);
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid buyer wallet address.' },
        { status: 400 },
      );
    }

    const dup = await prisma.tokenPurchase.findFirst({
      where: { solTransferTxHash },
      select: { id: true },
    });
    if (dup) {
      return NextResponse.json(
        { success: false, message: 'This payment transaction was already used.' },
        { status: 400 },
      );
    }

    const listing = await prisma.propertyListing.findFirst({
      where: { id: listingId, status: ListingStatus.ACTIVE },
      include: {
        property: { select: { id: true, referenceId: true, mintAddress: true } },
        seller: { select: { id: true, email: true, name: true, walletAddress: true } },
      },
    });

    if (!listing || !listing.property.mintAddress) {
      return NextResponse.json(
        { success: false, message: 'Listing not found or property not minted.' },
        { status: 404 },
      );
    }

    if (tBuy > listing.tokensRemaining) {
      return NextResponse.json(
        { success: false, message: 'Not enough tokens left on this listing.' },
        { status: 400 },
      );
    }

    if (listing.sellerId === decoded.userId) {
      return NextResponse.json(
        { success: false, message: 'You cannot buy tokens from your own listing.' },
        { status: 400 },
      );
    }

    const sellerWallet = listing.seller.walletAddress;
    if (!sellerWallet) {
      return NextResponse.json(
        { success: false, message: 'Seller has no linked wallet; cannot complete sale.' },
        { status: 400 },
      );
    }

    const buyerUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { email: true, name: true },
    });
    if (!buyerUser?.email) {
      return NextResponse.json(
        { success: false, message: 'No email on account; cannot record purchase.' },
        { status: 400 },
      );
    }

    let adminKeypair: ReturnType<typeof getAdminKeypair>;
    try {
      adminKeypair = getAdminKeypair();
      escrowAdminAddress = adminKeypair.publicKey.toBase58();
    } catch (e) {
      console.error('[buy listing] admin key', e);
      return NextResponse.json(
        { success: false, message: 'Server is not configured for on-chain operations.' },
        { status: 500 },
      );
    }

    const solPriceUsd = await getSolPriceUsd();
    const usdAmount = tBuy * listing.pricePerToken;
    const totalSolPaid = usdAmount / solPriceUsd;
    const platformFeeSol = totalSolPaid * 0.005;
    const sellerReceivedSol = totalSolPaid - platformFeeSol;

    const clientExpected =
      typeof body?.expectedTotalSol === 'number' && Number.isFinite(body.expectedTotalSol) && body.expectedTotalSol > 0
        ? body.expectedTotalSol
        : null;
    // Guardrail: do not let an absurd "expected" from the client undercut the true listing price
    if (clientExpected != null && clientExpected < totalSolPaid * 0.85) {
      return NextResponse.json(
        { success: false, message: 'Reported payment amount is inconsistent with the listing price. Refresh and try again.' },
        { status: 400 },
      );
    }
    const minSol = clientExpected == null ? totalSolPaid : Math.min(clientExpected, totalSolPaid);
    const minLamports = solToLamports(Math.max(0, minSol * 0.99));

    const connection = new Connection(getSolanaRpcUrl(), 'confirmed');

    const pay = await verifyBuyerToAdminTransferAndGetAmount(
      connection,
      solTransferTxHash,
      buyerPub!,
      adminKeypair.publicKey,
      minLamports,
    );
    if (!pay.ok) {
      return NextResponse.json(
        {
          success: false,
          code: 'PAYMENT_NOT_VERIFIED',
          message:
            'Could not verify the SOL transfer yet. It may still be confirming—wait a few seconds and use the same flow again with a new transfer, or check that the amount matches the “Total SOL to send” line. If you only paid the network fee, the purchase amount did not go through.',
        },
        { status: 400 },
      );
    }
    receivedLamports = pay.receivedLamports;

    const mint = new PublicKey(listing.property.mintAddress!);
    const sellerPub = new PublicKey(sellerWallet);
    const custody = await resolveCustodyForTransfer(connection, {
      mint,
      seller: sellerPub,
      admin: adminKeypair.publicKey,
      wholeTokens: tBuy,
    });
    if (!custody.ok) {
      const ref = await tryRefundLamportsToBuyer(
        connection,
        adminKeypair,
        buyerPub,
        receivedLamports,
      );
      return NextResponse.json(
        {
          success: false,
          code: 'CUSTODY_NOT_READY',
          adminWallet: adminKeypair.publicKey.toBase58(),
          message: ref.ok
            ? 'Token custody was not ready, so the purchase was cancelled. Your SOL payment was sent back in a new transaction. Check your wallet (refund can take a few seconds). If you do not see it, use support with the payment and refund signatures.'
            : 'Token custody was not ready and an automatic refund could not be sent. Please contact support with your payment transaction signature and this message.',
          refundTx: ref.ok ? ref.signature : undefined,
          refundError: ref.ok ? undefined : ref.error,
        },
        { status: 400 },
      );
    }
    const sourceAta = custody.sourceAta;

    const newRem = listing.tokensRemaining - tBuy;
    const nextStatus: ListingStatus = newRem === 0 ? ListingStatus.SOLD : ListingStatus.ACTIVE;
    const r = await prisma.propertyListing.updateMany({
      where: {
        id: listingId,
        status: ListingStatus.ACTIVE,
        tokensRemaining: { gte: tBuy },
      },
      data: {
        tokensRemaining: { decrement: tBuy },
        status: nextStatus,
      },
    });
    if (r.count !== 1) {
      return NextResponse.json(
        { success: false, message: 'Listing is no longer available for this size.' },
        { status: 409 },
      );
    }
    reserved = true;
    reservedQty = tBuy;

    const buyerAta = getAssociatedTokenAddressSync(mint, buyerPub, false, TOKEN_2022_PROGRAM_ID);

    const mintInfo = await getMint(connection, mint, 'confirmed', TOKEN_2022_PROGRAM_ID);
    const decimals = mintInfo.decimals;
    const amountRaw = BigInt(tBuy) * BigInt(10 ** decimals);

    const txb = new Transaction();
    const buyerAtaInfo = await connection.getAccountInfo(buyerAta);
    if (!buyerAtaInfo) {
      txb.add(
        createAssociatedTokenAccountInstruction(
          adminKeypair.publicKey,
          buyerAta,
          buyerPub,
          mint,
          TOKEN_2022_PROGRAM_ID,
        ),
      );
    }

    const authority: PublicKey = adminKeypair.publicKey;

    txb.add(
      createTransferCheckedInstruction(
        sourceAta,
        mint,
        buyerAta,
        authority,
        amountRaw,
        decimals,
        [],
        TOKEN_2022_PROGRAM_ID,
      ),
    );

    const { blockhash: bh0 } = await connection.getLatestBlockhash('confirmed');
    txb.recentBlockhash = bh0;
    txb.feePayer = adminKeypair.publicKey;
    const tokenTransferTxHash = await sendAndConfirmTransaction(connection, txb, [adminKeypair], {
      commitment: 'confirmed',
    });
    tokenComplete = true;

    const releaseLamports = solToLamports(sellerReceivedSol);
    const rel = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: adminKeypair.publicKey,
        toPubkey: sellerPub,
        lamports: releaseLamports,
      }),
    );
    const { blockhash: bh1 } = await connection.getLatestBlockhash('confirmed');
    rel.recentBlockhash = bh1;
    rel.feePayer = adminKeypair.publicKey;
    const solReleaseTxHash = await sendAndConfirmTransaction(connection, rel, [adminKeypair], {
      commitment: 'confirmed',
    });
    releaseComplete = true;

    const data = await prisma.$transaction(async (tx) => {
      const p = await tx.tokenPurchase.create({
        data: {
          listingId,
          buyerId: decoded.userId,
          sellerId: listing.sellerId,
          propertyId: listing.propertyId,
          tokensBought: tBuy,
          pricePerToken: listing.pricePerToken,
          totalSolPaid,
          platformFeeSol,
          sellerReceivedSol,
          solPriceUsdAtPurchase: solPriceUsd,
          buyerWallet,
          sellerWallet,
          solTransferTxHash,
          tokenTransferTxHash,
          solReleaseTxHash,
          status: PurchaseStatus.COMPLETED,
        },
        include: {
          property: { select: { referenceId: true } },
        },
      });

      await tx.propertyOwnership.upsert({
        where: {
          propertyId_userId: { propertyId: listing.propertyId, userId: decoded.userId },
        },
        create: {
          propertyId: listing.propertyId,
          userId: decoded.userId,
          tokensOwned: tBuy,
        },
        update: {
          tokensOwned: { increment: tBuy },
        },
      });

      await tx.auditLog.create({
        data: {
          userId: decoded.userId,
          action: 'token_purchase',
          details: JSON.stringify({
            purchaseId: p.id,
            listingId,
            propertyId: listing.propertyId,
            tokens: tBuy,
            totalSolPaid,
            platformFeeSol,
            solTransferTxHash,
            tokenTransferTxHash,
            solReleaseTxHash,
          }),
          success: true,
        },
      });

      return p;
    });

    const devnet = (process.env.SOLANA_RPC_URL || 'devnet').includes('mainnet') ? 'mainnet' : 'devnet';
    const txUrl = (h: string) => `https://explorer.solana.com/tx/${encodeURIComponent(h)}?cluster=${devnet}`;

    try {
      await sendEmail({
        to: buyerUser.email,
        subject: `Purchase confirmed — ${tBuy} AG tokens for ${data.property.referenceId}`,
        html: `<p>Hi${buyerUser.name ? ` ${buyerUser.name}` : ''},</p>
<p>You bought <strong>${tBuy}</strong> token(s) for <strong>${data.property.referenceId}</strong>.</p>
<p>Total paid: <strong>${totalSolPaid.toFixed(6)} SOL</strong> (incl. fee handling as per listing).</p>
<p>Token transfer: <a href="${txUrl(tokenTransferTxHash)}">${tokenTransferTxHash}</a></p>
<p>— AssetGuard</p>`,
        text: `You bought ${tBuy} AG tokens for ${data.property.referenceId}. Total paid: ${totalSolPaid} SOL. Token tx: ${tokenTransferTxHash}`,
      });
      if (listing.seller.email) {
        await sendEmail({
          to: listing.seller.email,
          subject: `Your tokens were sold — ${data.property.referenceId}`,
          html: `<p>Hi${listing.seller.name ? ` ${listing.seller.name}` : ''},</p>
<p><strong>${tBuy}</strong> token(s) of <strong>${data.property.referenceId}</strong> were purchased.</p>
<p>You received about <strong>${sellerReceivedSol.toFixed(6)} SOL</strong> (after 0.5% platform fee).</p>
<p>Release: <a href="${txUrl(solReleaseTxHash)}">${solReleaseTxHash}</a></p>
<p>— AssetGuard</p>`,
          text: `${tBuy} tokens of ${data.property.referenceId} were purchased. You received ${sellerReceivedSol} SOL. Release tx: ${solReleaseTxHash}`,
        });
      }
    } catch (em) {
      console.error('[buy listing] email', em);
    }

    apiLogger.response('POST', `/api/listings/${listingId}/buy`, 200, true);
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (e) {
    console.error('[POST /api/listings/[id]/buy]', e);
    if (reserved && reservedQty > 0 && !tokenComplete) {
      const cur = await prisma.propertyListing.findUnique({ where: { id: listingId } });
      if (cur) {
        const restored = cur.tokensRemaining + reservedQty;
        await prisma.propertyListing.update({
          where: { id: listingId },
          data: {
            tokensRemaining: restored,
            status: restored > 0 ? ListingStatus.ACTIVE : ListingStatus.SOLD,
          },
        });
      }
    }
    if (tokenComplete && !releaseComplete) {
      return NextResponse.json(
        {
          success: false,
          code: 'PAYOUT_INCOMPLETE',
          message:
            'Token transfer completed but seller SOL payout did not confirm. Your purchase may need manual review — keep your transaction signature.',
        },
        { status: 503 },
      );
    }

    let refundTx: string | undefined;
    if (receivedLamports != null && !tokenComplete && buyerPub) {
      try {
        const kp = getAdminKeypair();
        const conn = new Connection(getSolanaRpcUrl(), 'confirmed');
        const ref = await tryRefundLamportsToBuyer(conn, kp, buyerPub, receivedLamports);
        if (ref.ok) {
          refundTx = ref.signature;
        } else {
          console.error('[POST /api/listings/[id]/buy] refund failed', ref.error);
        }
      } catch (re) {
        console.error('[POST /api/listings/[id]/buy] refund exception', re);
      }
    }

    const baseMsg = e instanceof Error ? e.message : 'Purchase failed.';
    const withRefund =
      refundTx != null
        ? `${baseMsg} Your payment was returned in a new transaction. If the wallet balance does not update, contact support with both signatures.`
        : baseMsg;

    return NextResponse.json(
      {
        success: false,
        code: receivedLamports != null && !tokenComplete && refundTx ? 'SETTLEMENT_FAILED_REFUNDED' : undefined,
        message: withRefund,
        refundTx: refundTx ?? undefined,
        adminWallet: escrowAdminAddress,
      },
      { status: 500 },
    );
  }
}