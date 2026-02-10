/**
 * GET /api/kyc/status
 *
 * Returns the KYC record and status for the currently authenticated user,
 * or for a specific userId (admin-only).
 *
 * Query params:
 *   - userId (optional, admin-only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromAccessToken } from '@/lib/auth';
import { handleGetKYC } from '@/lib/kyc/controller';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const decoded = await getUserFromAccessToken();

  if (!decoded) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized. Please log in.' },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(request.url);
  let targetUserId = searchParams.get('userId');

  // Non-admin users can only query their own KYC
  if (targetUserId && targetUserId !== decoded.userId && !decoded.roles.includes('admin')) {
    return NextResponse.json(
      { success: false, message: 'Forbidden. You can only view your own KYC status.' },
      { status: 403 },
    );
  }

  // Default to the caller's own userId
  if (!targetUserId) {
    targetUserId = decoded.userId;
  }

  // Build a request with the userId query param for the controller
  const url = new URL(request.url);
  url.searchParams.set('userId', targetUserId);
  const syntheticRequest = new Request(url.toString(), {
    method: 'GET',
    headers: request.headers,
  });

  return handleGetKYC(syntheticRequest);
}
