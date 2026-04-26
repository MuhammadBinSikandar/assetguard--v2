// app/api/properties/my-properties/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/db/prismaClient';
import { getUserFromAccessToken } from '@/lib/auth';
import { apiLogger } from '@/lib/debug-logger';
import { getWalletMintBalance } from '@/lib/solana/token-balances';

export async function GET(request: NextRequest) {
  try {
    apiLogger.request('GET', '/api/properties/my-properties');

    // 1. Authenticate
    const decoded = await getUserFromAccessToken();
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Please log in.' },
        { status: 401 },
      );
    }

    // 2. Fetch all properties for this user
    const properties = await prisma.property.findMany({
      where: { ownerId: decoded.userId },
      select: {
        id: true,
        referenceId: true,
        propertyAddress: true,
        ownerName: true,
        borough: true,
        block: true,
        lot: true,
        propertyType: true,
        status: true,
        submittedAt: true,
        reviewedAt: true,
        estimatedPriceUSD: true,
        verifiedPriceUSD: true,
        walletAddress: true,
        adminNotes: true,
        mintAddress: true,
        tokenSupply: true,
        pricePerToken: true,
        tokenSymbol: true,
        _count: { select: { documents: true } },
      },
      orderBy: { submittedAt: 'desc' },
    });

    const ids = properties.map((p) => p.id);
    const myListings =
      ids.length > 0
        ? await prisma.propertyListing.findMany({
          where: { sellerId: decoded.userId, propertyId: { in: ids } },
          select: { id: true, status: true, propertyId: true },
        })
        : [];
    const listingByProperty = new Map(myListings.map((l) => [l.propertyId, l] as const));

    const data = await Promise.all(
      properties.map(async (p) => {
        const onChainBalance = await getWalletMintBalance(p.walletAddress, p.mintAddress);
        return {
          ...p,
          currentWalletTokens: onChainBalance != null ? Math.floor(onChainBalance) : null,
          listing: listingByProperty.get(p.id) ?? null,
        };
      }),
    );

    apiLogger.response('GET', '/api/properties/my-properties', 200, true);

    return NextResponse.json(
      {
        success: true,
        data,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('[My Properties] Error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while fetching properties.' },
      { status: 500 },
    );
  }
}
