import { NextRequest, NextResponse } from 'next/server';
import { PurchaseStatus, ListingStatus } from '@prisma/client';
import prisma from '@/db/prismaClient';
import { getUserFromAccessToken } from '@/lib/auth';
import { apiLogger } from '@/lib/debug-logger';
import { resolvePropertyTokenSupply } from '@/lib/property-tokens';

const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
    try {
        const { id: listingId } = await context.params;
        apiLogger.request('POST', `/api/listings/${listingId}/add-tokens`);

        if (!listingId || !UUID_RE.test(listingId)) {
            return NextResponse.json(
                { success: false, message: 'Invalid listing id.' },
                { status: 400 },
            );
        }

        const decoded = await getUserFromAccessToken();
        if (!decoded) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized. Please log in.' },
                { status: 401 },
            );
        }

        const body = await request.json().catch(() => null);
        const rawAdditional = body?.additionalTokens;
        let additionalTokens: number | null = null;
        if (typeof rawAdditional === 'number' && Number.isInteger(rawAdditional) && rawAdditional > 0) {
            additionalTokens = rawAdditional;
        } else if (typeof rawAdditional === 'string' && /^\d+$/.test(rawAdditional)) {
            const n = parseInt(rawAdditional, 10);
            if (n > 0) additionalTokens = n;
        }

        if (!additionalTokens) {
            return NextResponse.json(
                { success: false, message: 'Invalid additionalTokens.' },
                { status: 400 },
            );
        }

        const listing = await prisma.propertyListing.findUnique({
            where: { id: listingId },
            include: {
                property: {
                    select: {
                        ownerId: true,
                        tokenSupply: true,
                    },
                },
            },
        });

        if (!listing) {
            return NextResponse.json(
                { success: false, message: 'Listing not found.' },
                { status: 404 },
            );
        }

        if (listing.sellerId !== decoded.userId) {
            return NextResponse.json({ success: false, message: 'Forbidden.' }, { status: 403 });
        }

        if (listing.status !== ListingStatus.ACTIVE) {
            return NextResponse.json(
                { success: false, message: 'Only active listings can be updated.' },
                { status: 400 },
            );
        }

        const uid = decoded.userId;
        const [buyerAgg, sellerAgg] = await Promise.all([
            prisma.tokenPurchase.aggregate({
                where: {
                    propertyId: listing.propertyId,
                    buyerId: uid,
                    status: PurchaseStatus.COMPLETED,
                },
                _sum: { tokensBought: true },
            }),
            prisma.tokenPurchase.aggregate({
                where: {
                    propertyId: listing.propertyId,
                    sellerId: uid,
                    status: PurchaseStatus.COMPLETED,
                },
                _sum: { tokensBought: true },
            }),
        ]);

        const bought = buyerAgg._sum.tokensBought ?? 0;
        const sold = sellerAgg._sum.tokensBought ?? 0;
        const registrantBase =
            listing.property.ownerId === uid ? resolvePropertyTokenSupply(listing.property.tokenSupply) : 0;

        const currentlyHeld = Math.max(0, registrantBase + bought - sold);
        const maxAdditional = Math.max(0, currentlyHeld - listing.tokensRemaining);

        if (additionalTokens > maxAdditional) {
            return NextResponse.json(
                {
                    success: false,
                    message: `You can add at most ${maxAdditional} token(s) to this listing based on your current balance.`,
                },
                { status: 400 },
            );
        }

        const updated = await prisma.propertyListing.update({
            where: { id: listing.id },
            data: {
                tokensListed: { increment: additionalTokens },
                tokensRemaining: { increment: additionalTokens },
                totalValue: (listing.tokensListed + additionalTokens) * listing.pricePerToken,
            },
        });

        apiLogger.response('POST', `/api/listings/${listingId}/add-tokens`, 200, true);
        return NextResponse.json({ success: true, data: updated }, { status: 200 });
    } catch (error) {
        console.error('[listings add-tokens]', error);
        return NextResponse.json(
            { success: false, message: 'Failed to add tokens to listing.' },
            { status: 500 },
        );
    }
}
