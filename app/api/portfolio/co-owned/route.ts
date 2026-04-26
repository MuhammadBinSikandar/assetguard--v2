import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/db/prismaClient';
import { getUserFromAccessToken } from '@/lib/auth';
import { apiLogger } from '@/lib/debug-logger';
import { resolvePropertyTokenSupply, resolvePropertyPricePerToken } from '@/lib/property-tokens';
import { effectivePropertyValuationUsd } from '@/lib/property-valuation';
import { getWalletMintBalance } from '@/lib/solana/token-balances';

export async function GET(_req: NextRequest) {
  try {
    apiLogger.request('GET', '/api/portfolio/co-owned');
    const decoded = await getUserFromAccessToken();
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Please log in.' },
        { status: 401 },
      );
    }

    const [rows, activeListings, me] = await Promise.all([
      prisma.propertyOwnership.findMany({
        where: { userId: decoded.userId, tokensOwned: { gt: 0 } },
        orderBy: { updatedAt: 'desc' },
        include: {
          property: {
            select: {
              id: true,
              referenceId: true,
              borough: true,
              block: true,
              lot: true,
              estimatedPriceUSD: true,
              verifiedPriceUSD: true,
              mintAddress: true,
              pricePerToken: true,
              tokenSupply: true,
              propertyAddress: true,
            },
          },
        },
      }),
      prisma.propertyListing.findMany({
        where: { sellerId: decoded.userId, tokensRemaining: { gt: 0 } },
        orderBy: { updatedAt: 'desc' },
        include: {
          property: {
            select: {
              id: true,
              referenceId: true,
              borough: true,
              block: true,
              lot: true,
              estimatedPriceUSD: true,
              verifiedPriceUSD: true,
              mintAddress: true,
              pricePerToken: true,
              tokenSupply: true,
              propertyAddress: true,
            },
          },
        },
      }),
      prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { walletAddress: true },
      }),
    ]);

    const fromPo = new Map(rows.map((r) => [r.propertyId, r]));
    const fromListing = new Map(activeListings.map((l) => [l.propertyId, l]));
    const allIds = new Set([...fromPo.keys(), ...fromListing.keys()]);
    const allIdsList = [...allIds];

    const myListingRows =
      allIdsList.length > 0
        ? await prisma.propertyListing.findMany({
          where: { sellerId: decoded.userId, propertyId: { in: allIdsList } },
          select: { id: true, status: true, propertyId: true, tokensRemaining: true },
        })
        : [];
    const myListingByProperty = new Map(
      myListingRows.map((x) => [x.propertyId, x] as const),
    );

    const dataRows = await Promise.all(allIdsList.map(async (propertyId) => {
      const r = fromPo.get(propertyId);
      const l = fromListing.get(propertyId);
      const p = r?.property ?? l?.property;
      if (!p) return null;

      const fromPurchases = r?.tokensOwned ?? 0;
      const inListing = l ? l.tokensRemaining : 0;
      const dbTotalTokens = fromPurchases + inListing;
      const onChainBalance = await getWalletMintBalance(me?.walletAddress, p.mintAddress);
      const totalTokens = onChainBalance != null ? Math.floor(onChainBalance) : dbTotalTokens;
      const myListing = myListingByProperty.get(propertyId) ?? null;

      const supply = resolvePropertyTokenSupply(p.tokenSupply);
      const ppt = resolvePropertyPricePerToken(
        p.estimatedPriceUSD,
        p.verifiedPriceUSD,
        p.pricePerToken,
      );
      const shareUsd = totalTokens * ppt;
      const pct = supply > 0 ? (totalTokens / supply) * 100 : 0;
      const v = effectivePropertyValuationUsd(p.estimatedPriceUSD, p.verifiedPriceUSD);

      const canListSharesForSale =
        fromPurchases > 0 &&
        (!myListing || myListing.status === 'SOLD');

      return {
        ownershipId: r?.id ?? `listing-stake-${l?.id ?? propertyId}`,
        tokensOwned: totalTokens,
        tokensFromPurchases: fromPurchases,
        tokensInActiveListing: inListing,
        ownershipPercent: pct,
        estimatedShareUSD: shareUsd,
        fullValuationUSD: v,
        userListing: myListing
          ? {
            id: myListing.id,
            status: myListing.status,
            tokensRemaining: myListing.tokensRemaining,
          }
          : null,
        canListSharesForSale,
        property: {
          id: p.id,
          referenceId: p.referenceId,
          borough: p.borough,
          block: p.block,
          lot: p.lot,
          propertyAddress: p.propertyAddress,
          mintAddress: p.mintAddress,
          pricePerToken: ppt,
          tokenSupply: supply,
          estimatedPriceUSD: p.estimatedPriceUSD,
          verifiedPriceUSD: p.verifiedPriceUSD,
        },
      };
    }));

    const data = dataRows.filter((x) => x != null) as {
      ownershipId: string;
      tokensOwned: number;
      tokensFromPurchases: number;
      tokensInActiveListing: number;
      ownershipPercent: number;
      estimatedShareUSD: number;
      fullValuationUSD: number;
      userListing: { id: string; status: string; tokensRemaining: number } | null;
      canListSharesForSale: boolean;
      property: {
        id: string;
        referenceId: string;
        borough: string;
        block: string;
        lot: string;
        propertyAddress: string;
        mintAddress: string | null;
        pricePerToken: number;
        tokenSupply: number;
        estimatedPriceUSD: number;
        verifiedPriceUSD: number | null;
      };
    }[];

    apiLogger.response('GET', '/api/portfolio/co-owned', 200, true);
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (e) {
    console.error('[GET /api/portfolio/co-owned]', e);
    return NextResponse.json(
      { success: false, message: 'Failed to load co-owned properties.' },
      { status: 500 },
    );
  }
}
