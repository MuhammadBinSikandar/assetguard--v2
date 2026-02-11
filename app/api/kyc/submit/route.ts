/**
 * POST /api/kyc/submit
 *
 * Accepts a multipart/form-data request with:
 *   - userId   (text field)
 *   - fullName (text field)
 *   - idNumber (text field)
 *   - documents (file field – one or more files)
 *
 * Saves files locally via the FormData upload handler, persists the
 * KYC record, and sets the user's kycStatus to PENDING.
 */

import { NextRequest } from 'next/server';
import { handleSubmitKYC } from '@/lib/kyc/controller';

export const runtime = 'nodejs'; // Required – file I/O needs Node runtime

export async function POST(request: NextRequest) {
  return handleSubmitKYC(request);
}
