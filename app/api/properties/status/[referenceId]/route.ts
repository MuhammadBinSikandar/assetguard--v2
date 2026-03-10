import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/db/prismaClient';
import { getUserFromAccessToken } from '@/lib/auth';
import { apiLogger } from '@/lib/debug-logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ referenceId: string }> },
) {
  try {
    const { referenceId } = await params;
    apiLogger.request('GET', `/api/properties/status/${referenceId}`);

    // 1. Authenticate
    const decoded = await getUserFromAccessToken();
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Please log in.' },
        { status: 401 },
      );
    }

    // 2. Find property — enforce ownership (prevent IDOR)
    const property = await prisma.property.findUnique({
      where: { referenceId },
      select: {
        referenceId: true,
        status: true,
        submittedAt: true,
        reviewedAt: true,
        adminNotes: true,
        ownerId: true,
      },
    });

    if (!property || property.ownerId !== decoded.userId) {
      return NextResponse.json(
        { success: false, message: 'Property not found.' },
        { status: 404 },
      );
    }

    apiLogger.response('GET', `/api/properties/status/${referenceId}`, 200, true);

    return NextResponse.json(
      {
        success: true,
        data: {
          referenceId: property.referenceId,
          status: property.status,
          submittedAt: property.submittedAt,
          reviewedAt: property.reviewedAt,
          adminNotes: property.adminNotes,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('[Property Status] Error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while fetching property status.' },
      { status: 500 },
    );
  }
}
