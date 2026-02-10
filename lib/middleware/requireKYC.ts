/**
 * requireKYC Guardrail Middleware
 *
 * Checks the database to verify the authenticated user's kycStatus === APPROVED.
 * Use this to protect routes that require KYC verification (e.g., property
 * registration, token minting).
 *
 * Usage in a Next.js API route handler:
 *
 *   import { requireKYCApproved } from '@/lib/middleware/requireKYC';
 *
 *   export async function POST(request: NextRequest) {
 *     const guard = await requireKYCApproved();
 *     if (!guard.allowed) return guard.response;
 *
 *     // guard.userId is available for downstream logic
 *     const userId = guard.userId;
 *     // ... proceed with protected logic
 *   }
 */

import { NextResponse } from 'next/server';
import { getUserFromAccessToken } from '@/lib/auth';
import { getUserKycStatus } from '@/lib/kyc/service';
import { KycStatus } from '@prisma/client';

export type KYCGuardResult =
  | { allowed: true; userId: string; email: string; roles: string[] }
  | { allowed: false; response: NextResponse };

/**
 * Verify that the current caller is authenticated AND has an APPROVED KYC status.
 *
 * Returns either a success payload with user info, or a pre-built error
 * NextResponse that the route handler can return immediately.
 */
export async function requireKYCApproved(): Promise<KYCGuardResult> {
  // 1. Authentication check
  const decoded = await getUserFromAccessToken();

  if (!decoded) {
    return {
      allowed: false,
      response: NextResponse.json(
        { success: false, message: 'Unauthorized. Please log in.' },
        { status: 401 },
      ),
    };
  }

  // 2. KYC status check
  const kycStatus = await getUserKycStatus(decoded.userId);

  if (kycStatus !== KycStatus.APPROVED) {
    const statusMessages: Record<KycStatus, string> = {
      [KycStatus.IDLE]:
        'KYC verification required. Please complete your KYC submission before proceeding.',
      [KycStatus.PENDING]:
        'Your KYC submission is under review. Please wait for admin approval.',
      [KycStatus.REJECTED]:
        'Your KYC submission was rejected. Please re-submit with valid documents.',
      [KycStatus.APPROVED]: '', // never reached
    };

    return {
      allowed: false,
      response: NextResponse.json(
        {
          success: false,
          message: statusMessages[kycStatus],
          kycStatus,
        },
        { status: 403 },
      ),
    };
  }

  return {
    allowed: true,
    userId: decoded.userId,
    email: decoded.email,
    roles: decoded.roles,
  };
}
