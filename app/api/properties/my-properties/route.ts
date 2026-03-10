import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/db/prismaClient';
import { getUserFromAccessToken } from '@/lib/auth';
import { apiLogger } from '@/lib/debug-logger';

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
        walletAddress: true,
        adminNotes: true,
        _count: { select: { documents: true } },
      },
      orderBy: { submittedAt: 'desc' },
    });

    apiLogger.response('GET', '/api/properties/my-properties', 200, true);

    return NextResponse.json(
      {
        success: true,
        data: properties,
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
