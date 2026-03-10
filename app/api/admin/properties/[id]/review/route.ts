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

    return NextResponse.json(
      {
        success: true,
        message: `Property ${action === 'APPROVE' ? 'approved' : action === 'REJECT' ? 'rejected' : 'marked as under review'} successfully.`,
        data: result,
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
