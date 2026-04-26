// app/api/listings/my-listings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { ListingStatus } from '@prisma/client';
import prisma from '@/db/prismaClient';
import { getUserFromAccessToken } from '@/lib/auth';
import { apiLogger } from '@/lib/debug-logger';
import { getAdminKeypair, getSolanaRpcUrl } from '@/lib/solana/admin-keypair';
import { resolveCustodyForTransfer } from '@/lib/solana/listing-custody';
import { resolvePropertyTokenSupply } from '@/lib/property-tokens';
export async function GET(request: NextRequest) {
  try {
    apiLogger.request('GET', '/api/listings/my-listings');

    const decoded = await getUserFromAccessToken();
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Please log in.' },
        { status: 401 },
      );
    }

    const [listings, seller] = await Promise.all([
      prisma.propertyListing.findMany({
        where: { sellerId: decoded.userId },
        orderBy: { createdAt: 'desc' },
        include: {
          property: {
            select: {
              id: true,
              ownerId: true,
              referenceId: true,
              borough: true,
              block: true,
              lot: true,
              propertyAddress: true,
              estimatedPriceUSD: true,
              mintAddress: true,
              tokenSupply: true,
              pricePerToken: true,
            },
          },
          bookmarks: {
            where: { userId: decoded.userId },
            select: { id: true },
          },
        },
      }),
      prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { walletAddress: true },
      }),
    ]);

    const propertyIds = Array.from(new Set(listings.map((l) => l.propertyId)));
    const [buyAgg, sellAgg] = await Promise.all([
      propertyIds.length
        ? prisma.tokenPurchase.groupBy({
          by: ['propertyId'],
          where: {
            propertyId: { in: propertyIds },
            buyerId: decoded.userId,
            status: 'COMPLETED',
          },
          _sum: { tokensBought: true },
        })
        : Promise.resolve([]),
      propertyIds.length
        ? prisma.tokenPurchase.groupBy({
          by: ['propertyId'],
          where: {
            propertyId: { in: propertyIds },
            sellerId: decoded.userId,
            status: 'COMPLETED',
          },
          _sum: { tokensBought: true },
        })
        : Promise.resolve([]),
    ]);

    const boughtByProperty = new Map<string, number>(
      buyAgg.map((r) => [r.propertyId, r._sum.tokensBought ?? 0] as const),
    );
    const soldByProperty = new Map<string, number>(
      sellAgg.map((r) => [r.propertyId, r._sum.tokensBought ?? 0] as const),
    );

    let connection: Connection | null = null;
    let adminPub: PublicKey | null = null;
    try {
      const admin = getAdminKeypair();
      adminPub = admin.publicKey;
      connection = new Connection(getSolanaRpcUrl(), 'confirmed');
    } catch {
      // custody flags stay false
    }

    const sellerWalletOk =
      seller?.walletAddress &&
      (() => {
        try {
          new PublicKey(seller.walletAddress);
          return true;
        } catch {
          return false;
        }
      })();
    const sellerPub = sellerWalletOk ? new PublicKey(seller!.walletAddress as string) : null;

    const custodyReady = await Promise.all(
      listings.map(async (l) => {
        if (
          l.status !== ListingStatus.ACTIVE ||
          !l.property.mintAddress ||
          !connection ||
          !adminPub ||
          !sellerPub ||
          l.tokensRemaining < 1
        ) {
          return false;
        }
        const c = await resolveCustodyForTransfer(connection, {
          mint: new PublicKey(l.property.mintAddress),
          seller: sellerPub,
          admin: adminPub,
          wholeTokens: l.tokensRemaining,
        });
        return c.ok;
      }),
    );

    const data = listings.map((l, i) => ({
      id: l.id,
      propertyId: l.propertyId,
      tokensListed: l.tokensListed,
      tokensRemaining: l.tokensRemaining,
      pricePerToken: l.pricePerToken,
      totalValue: l.totalValue,
      status: l.status,
      createdAt: l.createdAt,
      updatedAt: l.updatedAt,
      property: l.property,
      bookmarked: l.bookmarks.length > 0,
      custodyReady: custodyReady[i] ?? false,
      maxAdditionalTokens: Math.max(
        0,
        (l.property.ownerId === decoded.userId ? resolvePropertyTokenSupply(l.property.tokenSupply) : 0) +
        (boughtByProperty.get(l.propertyId) ?? 0) -
        (soldByProperty.get(l.propertyId) ?? 0) -
        l.tokensRemaining,
      ),
    }));
    apiLogger.response('GET', '/api/listings/my-listings', 200, true);
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error('[my-listings]', error);
    return NextResponse.json(
      { success: false, message: 'Failed to load listings.' },
      { status: 500 },
    );
  }
}
