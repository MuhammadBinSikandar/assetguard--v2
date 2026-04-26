import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { ListingStatus } from '@prisma/client';
import prisma from '@/db/prismaClient';
import { getUserFromAccessToken } from '@/lib/auth';
import { getAdminKeypair, getSolanaRpcUrl } from '@/lib/solana/admin-keypair';
import { resolveCustodyForTransfer } from '@/lib/solana/listing-custody';
import { getSolPriceUsd } from '@/lib/solana/get-sol-price';
import { apiLogger } from '@/lib/debug-logger';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Pre-flight: check on-chain custody *before* the buyer sends SOL, so the UI can block payment.
 * GET /api/listings/:id/purchase-readiness?tokensToBuy=1
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: listingId } = await context.params;
    if (!listingId || !UUID_RE.test(listingId)) {
      return NextResponse.json({ success: false, message: 'Invalid listing id.' }, { status: 400 });
    }

    const decoded = await getUserFromAccessToken();
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const raw = searchParams.get('tokensToBuy');
    const tBuy = raw && /^\d+$/.test(raw) ? parseInt(raw, 10) : null;
    if (tBuy == null || tBuy < 1) {
      return NextResponse.json(
        { success: false, message: 'Query parameter tokensToBuy (positive integer) is required.' },
        { status: 400 },
      );
    }

    const listing = await prisma.propertyListing.findFirst({
      where: { id: listingId, status: ListingStatus.ACTIVE },
      include: {
        property: { select: { mintAddress: true } },
        seller: { select: { walletAddress: true } },
      },
    });

    if (!listing || !listing.property.mintAddress) {
      return NextResponse.json({ success: false, message: 'Listing not found or not available.' }, { status: 404 });
    }

    if (tBuy > listing.tokensRemaining) {
      return NextResponse.json(
        { success: true, data: { custodyOk: false, reason: 'NOT_ENOUGH_TOKENS' } },
        { status: 200 },
      );
    }

    if (listing.sellerId === decoded.userId) {
      return NextResponse.json(
        { success: true, data: { custodyOk: false, reason: 'OWN_LISTING' } },
        { status: 200 },
      );
    }

    const sw = listing.seller.walletAddress;
    if (!sw) {
      return NextResponse.json(
        { success: true, data: { custodyOk: false, reason: 'SELLER_NO_WALLET' } },
        { status: 200 },
      );
    }

    let adminKeypair: ReturnType<typeof getAdminKeypair>;
    try {
      adminKeypair = getAdminKeypair();
    } catch {
      return NextResponse.json(
        { success: false, message: 'Server is not configured for on-chain checks.' },
        { status: 500 },
      );
    }

    const connection = new Connection(getSolanaRpcUrl(), 'confirmed');
    const mint = new PublicKey(listing.property.mintAddress);
    const sellerPub = new PublicKey(sw);
    const custody = await resolveCustodyForTransfer(connection, {
      mint,
      seller: sellerPub,
      admin: adminKeypair.publicKey,
      wholeTokens: tBuy,
    });

    const solPriceUsd = await getSolPriceUsd();
    const usdAmount = tBuy * listing.pricePerToken;
    const totalSolEstimate = usdAmount / solPriceUsd;

    apiLogger.response('GET', `/api/listings/${listingId}/purchase-readiness`, 200, true);
    return NextResponse.json(
      {
        success: true,
        data: {
          custodyOk: custody.ok,
          adminWallet: adminKeypair.publicKey.toBase58(),
          path: custody.ok ? custody.path : undefined,
          totalSolEstimate,
          solPriceUsd,
          reason: custody.ok ? undefined : 'CUSTODY_NOT_READY',
        },
      },
      { status: 200 },
    );
  } catch (e) {
    console.error('[GET purchase-readiness]', e);
    return NextResponse.json({ success: false, message: 'Readiness check failed.' }, { status: 500 });
  }
}
