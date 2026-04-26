// GET /api/properties/[id] — public details for an approved property (marketplace / detail page)
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/db/prismaClient';
import { apiLogger } from '@/lib/debug-logger';
import { ListingStatus, PropertyStatus } from '@prisma/client';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    apiLogger.request('GET', `/api/properties/${id}`);

    if (!id || !UUID_RE.test(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid property id.' },
        { status: 400 },
      );
    }

    const property = await prisma.property.findFirst({
      where: { id, status: PropertyStatus.APPROVED },
      select: {
        id: true,
        referenceId: true,
        borough: true,
        block: true,
        lot: true,
        propertyAddress: true,
        ownerName: true,
        propertyType: true,
        taxClass: true,
        yearBuilt: true,
        stories: true,
        totalAreaSqFt: true,
        commercialUnits: true,
        residentialUnits: true,
        frontage: true,
        depth: true,
        landAreaSqFt: true,
        estimatedPriceUSD: true,
        verifiedPriceUSD: true,
        mintAddress: true,
        tokenSupply: true,
        pricePerToken: true,
        tokenSymbol: true,
        blockchainNetwork: true,
        submittedAt: true,
        reviewedAt: true,
        listings: {
          where: { status: ListingStatus.ACTIVE },
          orderBy: [{ tokensRemaining: 'desc' }, { createdAt: 'asc' }],
          take: 1,
          select: {
            id: true,
            status: true,
            tokensListed: true,
            tokensRemaining: true,
            pricePerToken: true,
            totalValue: true,
          },
        },
      },
    });

    if (!property) {
      return NextResponse.json(
        { success: false, message: 'Property not found.' },
        { status: 404 },
      );
    }

    const { listings, ...rest } = property;
    const payload = {
      ...rest,
      listing: listings[0] ?? null,
    };

    apiLogger.response('GET', `/api/properties/${id}`, 200, true);
    return NextResponse.json({ success: true, data: payload }, { status: 200 });
  } catch (error) {
    console.error('[GET /api/properties/[id]]', error);
    return NextResponse.json(
      { success: false, message: 'Failed to load property.' },
      { status: 500 },
    );
  }
}
