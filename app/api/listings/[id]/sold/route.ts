// app/api/listings/[id]/sold/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/db/prismaClient';
import { getUserFromAccessToken } from '@/lib/auth';
import { apiLogger } from '@/lib/debug-logger';
import { ListingStatus } from '@prisma/client';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    apiLogger.request('PATCH', `/api/listings/${id}/sold`);

    const decoded = await getUserFromAccessToken();
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Please log in.' },
        { status: 401 },
      );
    }

    const listing = await prisma.propertyListing.findUnique({ where: { id } });
    if (!listing) {
      return NextResponse.json({ success: false, message: 'Listing not found.' }, { status: 404 });
    }
    if (listing.sellerId !== decoded.userId) {
      return NextResponse.json({ success: false, message: 'Forbidden.' }, { status: 403 });
    }

    const updated = await prisma.propertyListing.update({
      where: { id },
      data: { status: ListingStatus.SOLD },
    });

    apiLogger.response('PATCH', `/api/listings/${id}/sold`, 200, true);
    return NextResponse.json({ success: true, data: updated }, { status: 200 });
  } catch (error) {
    console.error('[listings sold]', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update listing.' },
      { status: 500 },
    );
  }
}
