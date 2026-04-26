import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { PurchaseStatus, ListingStatus } from '@prisma/client';
import prisma from '@/db/prismaClient';
import { getUserFromAccessToken } from '@/lib/auth';
import { getAdminKeypair, getSolanaRpcUrl } from '@/lib/solana/admin-keypair';
import { getBuyerToAdminLamportsFromTx } from '@/lib/solana/verify-escrow-sol';
import { tryRefundLamportsToBuyer } from '@/lib/solana/refund-buyer-sol';
import { apiLogger } from '@/lib/debug-logger';

export async function POST(request: NextRequest) {
  try {
    const decoded = await getUserFromAccessToken();
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
    }
    if (!decoded.roles.includes('admin')) {
      return NextResponse.json({ success: false, message: 'Forbidden.' }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const purchaseId = typeof body?.purchaseId === 'string' ? body.purchaseId.trim() : null;
    if (!purchaseId) {
      return NextResponse.json({ success: false, message: 'Body must include purchaseId.' }, { status: 400 });
    }

    const purchase = await prisma.tokenPurchase.findUnique({
      where: { id: purchaseId },
      include: { listing: true },
    });
    if (!purchase) {
      return NextResponse.json({ success: false, message: 'Purchase not found.' }, { status: 404 });
    }
    if (purchase.refundTxHash) {
      return NextResponse.json({ success: false, message: 'This purchase was already refunded.' }, { status: 400 });
    }
    if (purchase.status !== PurchaseStatus.ESCROW_RECEIVED && purchase.status !== PurchaseStatus.FAILED) {
      return NextResponse.json(
        { success: false, message: 'Only ESCROW_RECEIVED or FAILED (unrefunded) purchases can be refunded here.' },
        { status: 400 },
      );
    }
    const ageMs = Date.now() - new Date(purchase.createdAt).getTime();
    if (ageMs < 10 * 60 * 1000) {
      return NextResponse.json(
        { success: false, message: 'Refunds are only available for purchases older than 10 minutes.' },
        { status: 400 },
      );
    }
    if (!purchase.solTransferTxHash) {
      return NextResponse.json(
        { success: false, message: 'No payment transaction hash; nothing to trace for refund.' },
        { status: 400 },
      );
    }

    const adminKeypair = getAdminKeypair();
    const connection = new Connection(getSolanaRpcUrl(), 'confirmed');
    const buyerPk = new PublicKey(purchase.buyerWallet);
    const lamports = await getBuyerToAdminLamportsFromTx(
      connection,
      purchase.solTransferTxHash,
      buyerPk,
      adminKeypair.publicKey,
    );
    if (lamports == null || lamports <= 0n) {
      return NextResponse.json(
        { success: false, message: 'Could not read payment amount from chain.' },
        { status: 400 },
      );
    }

    const ref = await tryRefundLamportsToBuyer(connection, adminKeypair, buyerPk, lamports);
    if (!ref.ok) {
      return NextResponse.json(
        { success: false, message: ref.error || 'Refund transaction failed.' },
        { status: 500 },
      );
    }

    const amountRefundedSol = Number(lamports) / Number(LAMPORTS_PER_SOL);

    await prisma.$transaction(async (tx) => {
      await tx.tokenPurchase.update({
        where: { id: purchaseId },
        data: {
          status: PurchaseStatus.FAILED,
          refundTxHash: ref.signature,
          refundedAt: new Date(),
        },
      });

      const list = await tx.propertyListing.findUnique({ where: { id: purchase.listingId } });
      if (list) {
        const newRem = Math.min(
          list.tokensListed,
          list.tokensRemaining + purchase.tokensBought,
        );
        await tx.propertyListing.update({
          where: { id: list.id },
          data: {
            tokensRemaining: newRem,
            status: newRem > 0 ? ListingStatus.ACTIVE : ListingStatus.SOLD,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: decoded.userId,
          action: 'manual_refund',
          success: true,
          details: JSON.stringify({
            purchaseId,
            refundTxHash: ref.signature,
            amountRefundedSol,
            amountRefundedLamports: lamports.toString(),
            previousStatus: purchase.status,
          }),
        },
      });
    });

    apiLogger.response('POST', '/api/admin/refund-purchase', 200, true);
    return NextResponse.json({
      success: true,
      data: { refundTxHash: ref.signature, amountRefundedSol },
    });
  } catch (e) {
    console.error('[POST /api/admin/refund-purchase]', e);
    return NextResponse.json(
      { success: false, message: e instanceof Error ? e.message : 'Refund failed.' },
      { status: 500 },
    );
  }
}
