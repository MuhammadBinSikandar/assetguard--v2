/**
 * KYC Module – Strict TypeScript Types
 * Shared across service, controller, and API routes.
 */

import type { KycStatus } from '@prisma/client';

// ── Request DTOs ─────────────────────────────────────────────────────────────

/** Fields expected alongside the file upload in the multipart form. */
export interface SubmitKYCBody {
  userId: string;
  fullName: string;
  idNumber: string;
}

/** Body sent by the admin when reviewing a KYC application. */
export interface AdminReviewBody {
  userId: string;
  status: 'APPROVED' | 'REJECTED';
  adminNotes?: string;
}

// ── Response DTOs ────────────────────────────────────────────────────────────

export interface KYCSubmissionResult {
  kycRecordId: string;
  kycStatus: KycStatus;
  /** Pinata CIDs for private files (same keys as DB `documentUrls`). */
  documentUrls: string[];
  submittedAt: Date;
}

export interface KYCReviewResult {
  userId: string;
  kycStatus: KycStatus;
  reviewedAt: Date;
  adminNotes: string | null;
}

// ── Upload ───────────────────────────────────────────────────────────────────

/** Metadata returned after a successful file save. */
export interface SavedFile {
  /** Content identifier returned by Pinata upload. */
  cid: string;
  /** Original name the user uploaded. */
  originalName: string;
  /** Stored filename (user_[userId]_[ts]_[original]). */
  storedName: string;
  /** File size in bytes. */
  size: number;
  /** MIME type. */
  mimeType: string;
}

// ── Error ────────────────────────────────────────────────────────────────────

export class KYCError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 400,
  ) {
    super(message);
    this.name = 'KYCError';
  }
}

// ── Constants ────────────────────────────────────────────────────────────────

/** Allowed MIME types for KYC document uploads. */
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const;

/** Maximum file size per upload (5 MB). */
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

/** Maximum number of files per submission. */
export const MAX_FILES_PER_SUBMISSION = 5;
