/**
 * KYC Controller
 *
 * Thin HTTP layer that validates incoming requests, delegates to the
 * service, and shapes responses.  Designed for Next.js App Router
 * route handlers (accepts `Request`, returns `NextResponse`).
 */

import { NextResponse } from 'next/server';
import { handleFileUpload } from './upload';
import {
  submitKYC as submitKYCService,
  adminReviewKYC,
  getKYCByUserId,
  listKYCSubmissions,
} from './service';
import { KYCError, type AdminReviewBody } from './types';
import { KycStatus } from '@prisma/client';

// ── Helpers ──────────────────────────────────────────────────────────────────

function errorResponse(error: unknown): NextResponse {
  if (error instanceof KYCError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: error.statusCode },
    );
  }

  console.error('[KYC Controller] Unexpected error:', error);
  return NextResponse.json(
    { success: false, message: 'Internal server error.' },
    { status: 500 },
  );
}

// ── Submit KYC ───────────────────────────────────────────────────────────────

/**
 * POST handler for KYC submission.
 * Expects multipart/form-data with fields: userId, fullName, idNumber
 * and one or more files under the "documents" field.
 */
export async function handleSubmitKYC(request: Request): Promise<NextResponse> {
  try {
    // 1. Parse multipart form + save files to disk
    const { fields, files } = await handleFileUpload(request);

    const { userId, fullName, idNumber } = fields;

    // 2. Validate required fields
    if (!userId || !fullName || !idNumber) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required fields: userId, fullName, idNumber.',
        },
        { status: 400 },
      );
    }

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, message: 'At least one document file is required.' },
        { status: 400 },
      );
    }

    // 3. Persist Pinata CIDs only (signed URLs expire; admins fetch fresh URLs via /api/admin/kyc-document)
    const documentUrls = files.map((f) => f.cid);

    // 4. Persist to database
    const result = await submitKYCService({
      userId,
      fullName,
      idNumber,
      documentUrls,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'KYC documents submitted successfully. Awaiting admin review.',
        data: result,
      },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}

// ── Admin Review ─────────────────────────────────────────────────────────────

/**
 * PATCH handler for admin KYC review.
 * Expects JSON body: { userId, status: 'APPROVED' | 'REJECTED', adminNotes? }
 * The admin's own userId is extracted from the verified JWT payload
 * attached to the request by upstream auth middleware.
 */
export async function handleAdminReview(
  request: Request,
  adminId: string,
): Promise<NextResponse> {
  try {
    const body = (await request.json()) as Partial<AdminReviewBody>;

    // Validate
    if (!body.userId) {
      return NextResponse.json(
        { success: false, message: 'Missing required field: userId.' },
        { status: 400 },
      );
    }

    if (!body.status || !['APPROVED', 'REJECTED'].includes(body.status)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid status. Must be "APPROVED" or "REJECTED".',
        },
        { status: 400 },
      );
    }

    const result = await adminReviewKYC({
      userId: body.userId,
      status: body.status,
      adminId,
      adminNotes: body.adminNotes,
    });

    return NextResponse.json(
      {
        success: true,
        message: `KYC ${body.status.toLowerCase()} successfully.`,
        data: result,
      },
      { status: 200 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}

// ── Get KYC Record ───────────────────────────────────────────────────────────

/**
 * GET handler – fetch a single KYC record by userId (query param).
 */
export async function handleGetKYC(
  request: Request,
): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Query parameter "userId" is required.' },
        { status: 400 },
      );
    }

    const record = await getKYCByUserId(userId);

    if (!record) {
      return NextResponse.json(
        { success: false, message: 'No KYC record found for this user.' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: record }, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}

// ── List KYC Submissions (Admin) ─────────────────────────────────────────────

/**
 * GET handler – list all KYC submissions with optional filters.
 * Query params: status (IDLE|PENDING|APPROVED|REJECTED), page, limit
 */
export async function handleListKYC(
  request: Request,
): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);

    const statusParam = searchParams.get('status') as KycStatus | null;
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));

    // Validate status if provided
    if (statusParam && !Object.values(KycStatus).includes(statusParam)) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid status filter. Must be one of: ${Object.values(KycStatus).join(', ')}`,
        },
        { status: 400 },
      );
    }

    const { records, total } = await listKYCSubmissions(
      statusParam ?? undefined,
      page,
      limit,
    );

    return NextResponse.json(
      {
        success: true,
        data: records,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
      { status: 200 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
