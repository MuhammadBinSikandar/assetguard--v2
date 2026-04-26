// app/api/listings/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/db/prismaClient';
import { getUserFromAccessToken } from '@/lib/auth';
import { apiLogger } from '@/lib/debug-logger';
import { ListingStatus } from '@prisma/client';

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    apiLogger.request('DELETE', `/api/listings/${id}`);

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
    if (listing.status !== ListingStatus.ACTIVE) {
      return NextResponse.json(
        { success: false, message: 'Only active listings can be removed.' },
        { status: 400 },
      );
    }

    await prisma.propertyListing.delete({ where: { id } });

    apiLogger.response('DELETE', `/api/listings/${id}`, 200, true);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[listings delete]', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete listing.' },
      { status: 500 },
    );
  }
}
