import { NextRequest, NextResponse } from 'next/server';
import { PurchaseStatus, ListingStatus } from '@prisma/client';
import prisma from '@/db/prismaClient';
import { getUserFromAccessToken } from '@/lib/auth';
import { apiLogger } from '@/lib/debug-logger';
import { resolvePropertyPricePerToken } from '@/lib/property-tokens';

/**
 * GET /api/dashboard/summary — aggregates for the main user dashboard.
 */
export async function GET(_req: NextRequest) {
  try {
    apiLogger.request('GET', '/api/dashboard/summary');
    const decoded = await getUserFromAccessToken();
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Please log in.' },
        { status: 401 },
      );
    }

    const uid = decoded.userId;

    const [ownerships, activeSellerListings, totalInvestments, recentRaw] = await Promise.all([
      prisma.propertyOwnership.findMany({
        where: { userId: uid, tokensOwned: { gt: 0 } },
        include: {
          property: {
            select: {
              id: true,
              referenceId: true,
              estimatedPriceUSD: true,
              verifiedPriceUSD: true,
              pricePerToken: true,
              tokenSupply: true,
            },
          },
        },
      }),
      prisma.propertyListing.findMany({
        where: { sellerId: uid, status: ListingStatus.ACTIVE, tokensRemaining: { gt: 0 } },
        include: {
          property: {
            select: {
              id: true,
              referenceId: true,
              estimatedPriceUSD: true,
              verifiedPriceUSD: true,
              pricePerToken: true,
              tokenSupply: true,
            },
          },
        },
      }),
      prisma.tokenPurchase.count({
        where: { buyerId: uid, status: PurchaseStatus.COMPLETED },
      }),
      prisma.tokenPurchase.findMany({
        where: { OR: [{ buyerId: uid }, { sellerId: uid }] },
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: {
          property: { select: { referenceId: true } },
        },
      }),
    ]);

    const propertyIdsWithStake = new Set<string>();
    let totalPortfolioValueUsd = 0;
    for (const r of ownerships) {
      const p = r.property;
      const ppt = resolvePropertyPricePerToken(
        p.estimatedPriceUSD,
        p.verifiedPriceUSD,
        p.pricePerToken,
      );
      totalPortfolioValueUsd += r.tokensOwned * ppt;
      propertyIdsWithStake.add(p.id);
    }
    for (const l of activeSellerListings) {
      const p = l.property;
      const ppt = resolvePropertyPricePerToken(
        p.estimatedPriceUSD,
        p.verifiedPriceUSD,
        p.pricePerToken,
      );
      totalPortfolioValueUsd += l.tokensRemaining * ppt;
      propertyIdsWithStake.add(p.id);
    }
    const propertiesOwned = propertyIdsWithStake.size;

    const recent = recentRaw.map((p) => ({
      id: p.id,
      type: p.buyerId === uid ? ('Bought' as const) : ('Sold' as const),
      createdAt: p.createdAt.toISOString(),
      propertyReferenceId: p.property.referenceId,
      tokens: p.tokensBought,
      totalSolPaid: p.totalSolPaid,
      status: p.status,
    }));

    apiLogger.response('GET', '/api/dashboard/summary', 200, true);
    return NextResponse.json(
      {
        success: true,
        data: {
          totalPortfolioValueUsd,
          totalInvestments,
          propertiesOwned,
          recent,
        },
      },
      { status: 200 },
    );
  } catch (e) {
    console.error('[GET /api/dashboard/summary]', e);
    return NextResponse.json(
      { success: false, message: 'Failed to load dashboard summary.' },
      { status: 500 },
    );
  }
}
