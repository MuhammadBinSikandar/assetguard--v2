import { NextRequest, NextResponse } from 'next/server';
import { getUserFromAccessToken } from '@/lib/auth';
import { updatePropertyStatus } from '@/lib/data/properties';
import { z } from 'zod';

const reviewSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT', 'UNDER_REVIEW']),
  adminNotes: z.string().optional(),
}).refine(
  (data) => data.action !== 'REJECT' || (data.adminNotes && data.adminNotes.trim().length > 0),
  { message: 'Admin notes are required when rejecting a property.', path: ['adminNotes'] },
);

export async function PATCH(
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

    // Parse and validate body
    const body = await request.json();
    const validation = reviewSchema.safeParse(body);
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

    const { action, adminNotes } = validation.data;
    const result = await updatePropertyStatus(id, action, decoded.userId, adminNotes);

    if (!result) {
      return NextResponse.json(
        { success: false, message: 'Property not found.' },
        { status: 404 },
      );
    }

    let minting: {
      attempted: boolean;
      success: boolean;
      status: number;
      message: string;
      data: unknown;
    } | null = null;

    if (action === 'APPROVE') {
      const mintUrl = `${request.nextUrl.origin}/api/admin/mint-property`;
      const cookieHeader = request.headers.get('cookie');

      try {
        const mintRes = await fetch(mintUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(cookieHeader ? { cookie: cookieHeader } : {}),
          },
          cache: 'no-store',
          body: JSON.stringify({
            propertyId: result.id,
            userWalletAddress: result.walletAddress,
          }),
        });

        const mintJson = await mintRes.json().catch(() => ({}));

        minting = {
          attempted: true,
          success: mintRes.ok && Boolean(mintJson?.success),
          status: mintRes.status,
          message:
            typeof mintJson?.message === 'string'
              ? mintJson.message
              : mintRes.ok
                ? 'Minting completed.'
                : 'Minting failed.',
          data: mintJson?.data ?? null,
        };
      } catch (mintError) {
        minting = {
          attempted: true,
          success: false,
          status: 500,
          message:
            mintError instanceof Error ? mintError.message : 'Minting request failed.',
          data: null,
        };
      }
    }

    const approvalMessage =
      action === 'APPROVE'
        ? minting?.success
          ? 'Property approved and tokens minted successfully.'
          : 'Property approved, but token minting failed. You can retry minting from the property details panel.'
        : action === 'REJECT'
          ? 'Property rejected successfully.'
          : 'Property marked as under review successfully.';

    return NextResponse.json(
      {
        success: true,
        message: approvalMessage,
        data: {
          ...result,
          minting,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('[Admin Property Review] Error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while reviewing the property.' },
      { status: 500 },
    );
  }
}
