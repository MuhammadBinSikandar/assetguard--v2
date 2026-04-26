// app/api/listings/marketplace/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/db/prismaClient';
import { getUserFromAccessToken } from '@/lib/auth';
import { apiLogger } from '@/lib/debug-logger';
import { ListingStatus, Prisma, PropertyType } from '@prisma/client';

const PUBLIC_SELLER_SELECT = { id: true, name: true } as const;

function parseStatus(v: string | null): 'all' | ListingStatus {
  if (!v) return 'all';
  const s = v.toLowerCase();
  if (s === 'active') return ListingStatus.ACTIVE;
  if (s === 'sold') return ListingStatus.SOLD;
  return 'all';
}

function parseType(v: string | null): PropertyType | null {
  if (!v) return null;
  const upper = v.toUpperCase().replace(/[- ]/g, '_');
  if (upper in PropertyType) return upper as PropertyType;
  return null;
}

export async function GET(request: NextRequest) {
  try {
    apiLogger.request('GET', '/api/listings/marketplace');

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get('search') || '').trim();
    const minP = searchParams.get('minPrice');
    const maxP = searchParams.get('maxPrice');
    const minPrice = minP != null && minP !== '' ? parseFloat(minP) : null;
    const maxPrice = maxP != null && maxP !== '' ? parseFloat(maxP) : null;
    const statusMode = parseStatus(searchParams.get('status'));
    const typeFilter = parseType(searchParams.get('type'));
    const bo = searchParams.get('bookmarkedOnly');
    const bm = searchParams.get('bookmarked');
    const bookmarkedOnly =
      bo === 'true' ||
      bo === '1' ||
      bm === 'true' ||
      bm === '1';

    const decoded = await getUserFromAccessToken();
    if (bookmarkedOnly && !decoded) {
      return NextResponse.json(
        { success: false, message: 'Sign in to see bookmarked listings.' },
        { status: 401 },
      );
    }

    const whereAnd: Prisma.PropertyListingWhereInput[] = [
      { status: { in: [ListingStatus.ACTIVE, ListingStatus.SOLD] } },
    ];
    if (statusMode !== 'all') {
      whereAnd[0] = { status: statusMode };
    }

    if (typeFilter) {
      whereAnd.push({ property: { is: { propertyType: typeFilter } } });
    }

    if (minPrice != null && !Number.isNaN(minPrice)) {
      whereAnd.push({ totalValue: { gte: minPrice } });
    }
    if (maxPrice != null && !Number.isNaN(maxPrice)) {
      whereAnd.push({ totalValue: { lte: maxPrice } });
    }

    if (search) {
      const term = search.replace(/%/g, '\\%');
      whereAnd.push({
        OR: [
          { property: { borough: { contains: term, mode: 'insensitive' } } },
          { property: { propertyAddress: { contains: term, mode: 'insensitive' } } },
        ],
      });
    }

    if (bookmarkedOnly && decoded) {
      whereAnd.push({ bookmarks: { some: { userId: decoded.userId } } });
    }

    const listings = await prisma.propertyListing.findMany({
      where: { AND: whereAnd },
      orderBy: { createdAt: 'desc' },
      include: {
        property: {
          select: {
            id: true,
            referenceId: true,
            borough: true,
            block: true,
            lot: true,
            propertyAddress: true,
            propertyType: true,
            estimatedPriceUSD: true,
            totalAreaSqFt: true,
            mintAddress: true,
            tokenSupply: true,
            pricePerToken: true,
            verifiedPriceUSD: true,
          },
        },
        seller: { select: PUBLIC_SELLER_SELECT },
        _count: { select: { bookmarks: true } },
      },
    });

    const bookmarkedIds = new Set<string>();
    if (decoded) {
      const marks = await prisma.listingBookmark.findMany({
        where: {
          userId: decoded.userId,
          listingId: { in: listings.map((l) => l.id) },
        },
        select: { listingId: true },
      });
      marks.forEach((m) => bookmarkedIds.add(m.listingId));
    }

    const data = listings.map((l) => ({
      id: l.id,
      propertyId: l.propertyId,
      tokensListed: l.tokensListed,
      tokensRemaining: l.tokensRemaining,
      pricePerToken: l.pricePerToken,
      totalValue: l.totalValue,
      status: l.status,
      createdAt: l.createdAt,
      property: l.property,
      seller: l.seller,
      bookmarkCount: l._count.bookmarks,
      bookmarked: bookmarkedIds.has(l.id),
    }));

    apiLogger.response('GET', '/api/listings/marketplace', 200, true);
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error('[listings marketplace]', error);
    return NextResponse.json(
      { success: false, message: 'Failed to load marketplace.' },
      { status: 500 },
    );
  }
}
