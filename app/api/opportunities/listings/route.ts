// app/api/opportunities/listings/route.ts
// Public endpoint — returns all APPROVED properties for the opportunities page
import { NextResponse } from 'next/server';
import prisma from '@/db/prismaClient';

export async function GET() {
  try {
    const properties = await prisma.property.findMany({
      where: { status: 'APPROVED' },
      select: {
        id: true,
        propertyAddress: true,
        borough: true,
        block: true,
        lot: true,
        propertyType: true,
        estimatedPriceUSD: true,
        verifiedPriceUSD: true,
        totalAreaSqFt: true,
        residentialUnits: true,
        commercialUnits: true,
        yearBuilt: true,
        submittedAt: true,
      },
      orderBy: { submittedAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: properties }, { status: 200 });
  } catch (error) {
    console.error('[Opportunities Listings] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch listings.' },
      { status: 500 },
    );
  }
}
