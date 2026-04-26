// app/api/listings/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/db/prismaClient';
import { getUserFromAccessToken } from '@/lib/auth';
import { apiLogger } from '@/lib/debug-logger';
import { ListingStatus, PropertyStatus, PurchaseStatus } from '@prisma/client';
import {
  resolvePropertyPricePerToken,
  resolvePropertyTokenSupply,
} from '@/lib/property-tokens';

export async function POST(request: NextRequest) {
  try {
    apiLogger.request('POST', '/api/listings/create');

    const decoded = await getUserFromAccessToken();
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Please log in.' },
        { status: 401 },
      );
    }

    const body = await request.json();
    const propertyId = typeof body?.propertyId === 'string' ? body.propertyId : null;
    const rawTokens = body?.tokensListed;
    let tokensListed: number | null = null;
    if (typeof rawTokens === 'number' && Number.isInteger(rawTokens) && rawTokens > 0) {
      tokensListed = rawTokens;
    } else if (typeof rawTokens === 'string' && /^\d+$/.test(rawTokens)) {
      const n = parseInt(rawTokens, 10);
      if (n > 0) tokensListed = n;
    }

    if (!propertyId || !tokensListed) {
      return NextResponse.json(
        { success: false, message: 'Invalid propertyId or tokensListed.' },
        { status: 400 },
      );
    }

    const uid = decoded.userId;

    const property = await prisma.property.findFirst({
      where: { id: propertyId, status: PropertyStatus.APPROVED },
    });

    if (!property || !property.mintAddress) {
      return NextResponse.json(
        { success: false, message: 'Property not found, not approved, or not minted.' },
        { status: 404 },
      );
    }

    const isRegistrant = property.ownerId === uid;

    const tokenSupply = resolvePropertyTokenSupply(property.tokenSupply);
    const pricePerToken = resolvePropertyPricePerToken(
      property.estimatedPriceUSD,
      property.verifiedPriceUSD,
      property.pricePerToken,
    );

    const existing = await prisma.propertyListing.findFirst({
      where: { propertyId, sellerId: uid },
    });

    const [buyerAgg, sellerAgg] = await Promise.all([
      prisma.tokenPurchase.aggregate({
        where: {
          propertyId,
          buyerId: uid,
          status: PurchaseStatus.COMPLETED,
        },
        _sum: { tokensBought: true },
      }),
      prisma.tokenPurchase.aggregate({
        where: {
          propertyId,
          sellerId: uid,
          status: PurchaseStatus.COMPLETED,
        },
        _sum: { tokensBought: true },
      }),
    ]);

    const bought = buyerAgg._sum.tokensBought ?? 0;
    const sold = sellerAgg._sum.tokensBought ?? 0;
    const currentlyHeld = Math.max(0, (isRegistrant ? tokenSupply : 0) + bought - sold);
    const activeListed = existing?.status === ListingStatus.ACTIVE ? existing.tokensRemaining : 0;
    const maxNewListingTokens = Math.max(0, currentlyHeld - activeListed);

    if (maxNewListingTokens < 1) {
      return NextResponse.json(
        { success: false, message: 'You do not currently have available tokens to list for this property.' },
        { status: 403 },
      );
    }

    if (tokensListed > maxNewListingTokens) {
      return NextResponse.json(
        {
          success: false,
          message: `You can list at most ${maxNewListingTokens} token(s) based on your current balance.`,
        },
        { status: 400 },
      );
    }

    if (existing?.status === ListingStatus.ACTIVE) {
      return NextResponse.json(
        { success: false, message: 'You already have an active listing for this property.' },
        { status: 400 },
      );
    }

    const totalValue = tokensListed * pricePerToken;

    const listing = existing
      ? await prisma.propertyListing.update({
        where: { id: existing.id },
        data: {
          status: ListingStatus.ACTIVE,
          tokensListed,
          tokensRemaining: tokensListed,
          pricePerToken,
          totalValue,
        },
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
              mintAddress: true,
              tokenSupply: true,
              pricePerToken: true,
            },
          },
        },
      })
      : await prisma.propertyListing.create({
        data: {
          propertyId,
          sellerId: uid,
          tokensListed,
          tokensRemaining: tokensListed,
          pricePerToken,
          totalValue,
          status: ListingStatus.ACTIVE,
        },
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
              mintAddress: true,
              tokenSupply: true,
              pricePerToken: true,
            },
          },
        },
      });

    apiLogger.response('POST', '/api/listings/create', 200, true);
    return NextResponse.json({ success: true, data: listing }, { status: 201 });
  } catch (error) {
    console.error('[Listings create]', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create listing.' },
      { status: 500 },
    );
  }
}
