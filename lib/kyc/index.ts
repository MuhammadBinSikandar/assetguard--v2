/**
 * KYC Module – Barrel Export
 */

export { handleSubmitKYC, handleAdminReview, handleGetKYC, handleListKYC } from './controller';
export { submitKYC, adminReviewKYC, getKYCByUserId, getUserKycStatus, listKYCSubmissions } from './service';
export { handleFileUpload } from './upload';
export { KYCError, ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES, UPLOAD_DIR, UPLOAD_URL_PREFIX } from './types';
export type { SubmitKYCBody, AdminReviewBody, KYCSubmissionResult, KYCReviewResult, SavedFile } from './types';
