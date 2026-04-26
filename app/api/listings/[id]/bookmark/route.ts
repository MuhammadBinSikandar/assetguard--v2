// app/api/listings/[id]/bookmark/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/db/prismaClient';
import { getUserFromAccessToken } from '@/lib/auth';
import { apiLogger } from '@/lib/debug-logger';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: listingId } = await context.params;
    apiLogger.request('POST', `/api/listings/${listingId}/bookmark`);

    const decoded = await getUserFromAccessToken();
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Please log in.' },
        { status: 401 },
      );
    }

    const listing = await prisma.propertyListing.findUnique({ where: { id: listingId } });
    if (!listing) {
      return NextResponse.json({ success: false, message: 'Listing not found.' }, { status: 404 });
    }

    const existing = await prisma.listingBookmark.findUnique({
      where: { userId_listingId: { userId: decoded.userId, listingId } },
    });

    if (existing) {
      await prisma.listingBookmark.delete({ where: { id: existing.id } });
      apiLogger.response('POST', `/api/listings/${listingId}/bookmark`, 200, true);
      return NextResponse.json({ success: true, bookmarked: false }, { status: 200 });
    }

    await prisma.listingBookmark.create({
      data: { userId: decoded.userId, listingId },
    });
    apiLogger.response('POST', `/api/listings/${listingId}/bookmark`, 200, true);
    return NextResponse.json({ success: true, bookmarked: true }, { status: 200 });
  } catch (error) {
    console.error('[listings bookmark]', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update bookmark.' },
      { status: 500 },
    );
  }
}
