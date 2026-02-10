/**
 * KYC Service Layer
 *
 * All database interactions for the KYC module live here.
 * Controllers call these pure functions — no HTTP concepts leak in.
 */

import prisma from '@/db/prismaClient';
import { KycStatus, type KYCRecord, type User } from '@prisma/client';
import {
  KYCError,
  type KYCSubmissionResult,
  type KYCReviewResult,
} from './types';

// ── Submit KYC ───────────────────────────────────────────────────────────────

export interface SubmitKYCParams {
  userId: string;
  fullName: string;
  idNumber: string;
  documentUrls: string[];
}

/**
 * Create (or update) a KYC record and set the user's status to PENDING.
 *
 * Business rules:
 * - A user who is already APPROVED cannot re-submit.
 * - A user who is PENDING cannot re-submit (must wait for admin review).
 * - A user who was REJECTED *can* re-submit with new documents.
 */
export async function submitKYC(params: SubmitKYCParams): Promise<KYCSubmissionResult> {
  const { userId, fullName, idNumber, documentUrls } = params;

  // 1. Verify user exists
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new KYCError('User not found.', 404);
  }

  // 2. Guard: already approved or pending
  if (user.kycStatus === KycStatus.APPROVED) {
    throw new KYCError('KYC is already approved. No re-submission is necessary.', 409);
  }
  if (user.kycStatus === KycStatus.PENDING) {
    throw new KYCError('A KYC submission is already under review. Please wait for admin decision.', 409);
  }

  // 3. Upsert KYC record + update user status in a transaction
  const [kycRecord] = await prisma.$transaction([
    prisma.kYCRecord.upsert({
      where: { userId },
      create: {
        userId,
        fullName,
        idNumber,
        documentUrls,
      },
      update: {
        fullName,
        idNumber,
        documentUrls,
        submittedAt: new Date(),
        reviewedAt: null,
        reviewedBy: null,
        adminNotes: null,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { kycStatus: KycStatus.PENDING },
    }),
  ]);

  return {
    kycRecordId: kycRecord.id,
    kycStatus: KycStatus.PENDING,
    documentUrls: kycRecord.documentUrls,
    submittedAt: kycRecord.submittedAt,
  };
}

// ── Admin Review ─────────────────────────────────────────────────────────────

export interface AdminReviewParams {
  userId: string;
  status: 'APPROVED' | 'REJECTED';
  adminId: string;
  adminNotes?: string;
}

/**
 * Allow an admin to approve or reject a user's KYC.
 *
 * On approval the `kyc_verified` role is added to the user's `roles` array
 * so existing role-based guards keep working.
 */
export async function adminReviewKYC(params: AdminReviewParams): Promise<KYCReviewResult> {
  const { userId, status, adminId, adminNotes } = params;

  // 1. Load user + existing KYC record
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { kycRecord: true },
  });

  if (!user) {
    throw new KYCError('User not found.', 404);
  }
  if (!user.kycRecord) {
    throw new KYCError('No KYC submission found for this user.', 404);
  }
  if (user.kycStatus !== KycStatus.PENDING) {
    throw new KYCError(
      `Cannot review a KYC that is currently "${user.kycStatus}". Only PENDING submissions can be reviewed.`,
      409,
    );
  }

  const newKycStatus = status === 'APPROVED' ? KycStatus.APPROVED : KycStatus.REJECTED;
  const now = new Date();

  // 2. Build updated roles array
  let updatedRoles = [...user.roles];
  if (newKycStatus === KycStatus.APPROVED && !updatedRoles.includes('kyc_verified')) {
    updatedRoles.push('kyc_verified');
  }
  if (newKycStatus === KycStatus.REJECTED) {
    updatedRoles = updatedRoles.filter((r) => r !== 'kyc_verified');
  }

  // 3. Transactional update
  await prisma.$transaction([
    prisma.kYCRecord.update({
      where: { userId },
      data: {
        reviewedAt: now,
        reviewedBy: adminId,
        adminNotes: adminNotes ?? null,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: {
        kycStatus: newKycStatus,
        roles: updatedRoles,
      },
    }),
    // Audit log entry
    prisma.auditLog.create({
      data: {
        userId: adminId,
        action: `kyc_${status.toLowerCase()}`,
        details: JSON.stringify({ targetUserId: userId, adminNotes }),
        success: true,
      },
    }),
  ]);

  return {
    userId,
    kycStatus: newKycStatus,
    reviewedAt: now,
    adminNotes: adminNotes ?? null,
  };
}

// ── Query helpers ────────────────────────────────────────────────────────────

/** Get a single KYC record by userId. */
export async function getKYCByUserId(userId: string): Promise<KYCRecord | null> {
  return prisma.kYCRecord.findUnique({ where: { userId } });
}

/** Get the KYC status for a user (returns IDLE if user not found). */
export async function getUserKycStatus(userId: string): Promise<KycStatus> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { kycStatus: true },
  });
  return user?.kycStatus ?? KycStatus.IDLE;
}

/** List all KYC submissions, optionally filtered by status. */
export async function listKYCSubmissions(
  statusFilter?: KycStatus,
  page = 1,
  limit = 20,
): Promise<{ records: (KYCRecord & { user: Pick<User, 'id' | 'email' | 'name' | 'kycStatus'> })[]; total: number }> {
  const where = statusFilter
    ? { user: { kycStatus: statusFilter } }
    : {};

  const [records, total] = await prisma.$transaction([
    prisma.kYCRecord.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, name: true, kycStatus: true } },
      },
      orderBy: { submittedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.kYCRecord.count({ where }),
  ]);

  return { records, total };
}
