/**
 * /api/kyc/review
 *
 * PATCH – Admin approves or rejects a KYC submission.
 * GET   – Admin lists KYC submissions (with optional filters).
 *
 * Both methods are admin-only: the handler verifies that the
 * caller has the "admin" role via the access token cookie.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromAccessToken } from '@/lib/auth';
import { handleAdminReview, handleListKYC } from '@/lib/kyc/controller';

export const runtime = 'nodejs';

// ── Auth guard (admin only) ──────────────────────────────────────────────────

async function requireAdmin(): Promise<
  | { authorized: true; adminId: string }
  | { authorized: false; response: NextResponse }
> {
  const decoded = await getUserFromAccessToken();

  if (!decoded) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, message: 'Unauthorized. Please log in.' },
        { status: 401 },
      ),
    };
  }

  if (!decoded.roles.includes('admin')) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, message: 'Forbidden. Admin access required.' },
        { status: 403 },
      ),
    };
  }

  return { authorized: true, adminId: decoded.userId };
}

// ── PATCH – Review a KYC submission ──────────────────────────────────────────

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  return handleAdminReview(request, auth.adminId);
}

// ── GET – List KYC submissions ───────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  return handleListKYC(request);
}
