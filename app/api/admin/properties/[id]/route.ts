import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserFromAccessToken } from '@/lib/auth';
import { getAdminPropertyDetail, updatePropertyVerifiedPrice } from '@/lib/data/properties';

const patchPropertySchema = z.object({
  verifiedPriceUSD: z.union([z.number().min(0, 'Price cannot be negative'), z.null()]),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Auth + Admin check
    const decoded = await getUserFromAccessToken();
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Please log in.' },
        { status: 401 },
      );
    }
    if (!decoded.roles.includes('admin')) {
      return NextResponse.json(
        { success: false, message: 'Forbidden. Admin access required.' },
        { status: 403 },
      );
    }

    const property = await getAdminPropertyDetail(id);

    if (!property) {
      return NextResponse.json(
        { success: false, message: 'Property not found.' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: property }, { status: 200 });
  } catch (error) {
    console.error('[Admin Property Detail] Error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while fetching property details.' },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const decoded = await getUserFromAccessToken();
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Please log in.' },
        { status: 401 },
      );
    }
    if (!decoded.roles.includes('admin')) {
      return NextResponse.json(
        { success: false, message: 'Forbidden. Admin access required.' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const validation = patchPropertySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed.',
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { verifiedPriceUSD } = validation.data;

    try {
      const updated = await updatePropertyVerifiedPrice(id, verifiedPriceUSD);
      return NextResponse.json({ success: true, data: updated }, { status: 200 });
    } catch {
      return NextResponse.json(
        { success: false, message: 'Property not found.' },
        { status: 404 },
      );
    }
  } catch (error) {
    console.error('[Admin Property PATCH] Error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while updating the property.' },
      { status: 500 },
    );
  }
}
