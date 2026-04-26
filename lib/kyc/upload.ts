/**
 * KYC File Upload Handler
 *
 * Uses the native Web FormData API (Next.js App Router compatible).
 * Files are uploaded to Pinata private storage with the format:
 *   user_[userId]_[timestamp]_[originalName]
 */

import { PinataSDK } from 'pinata';
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  MAX_FILES_PER_SUBMISSION,
  KYCError,
  type SavedFile,
} from './types';

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: process.env.PINATA_GATEWAY,
});

type LegacyUploadApi = {
  file?: (file: File) => {
    keyvalues: (keyvalues: Record<string, string>) => {
      private: () => Promise<{ cid: string }>;
    };
  };
};

async function uploadPrivateFile(
  file: File,
  keyvalues: Record<string, string>,
): Promise<{ cid: string }> {
  const legacyUpload = pinata.upload as unknown as LegacyUploadApi;

  if (typeof legacyUpload.file === 'function') {
    return legacyUpload.file(file).keyvalues(keyvalues).private();
  }

  return pinata.upload.private.file(file).keyvalues(keyvalues);
}

// ── Next.js App Router helper ────────────────────────────────────────────────

/**
 * Parse a native Web `Request` (Next.js App Router) FormData.
 *
 * Returns the parsed text fields and saved file information.
 */
export async function handleFileUpload(
  request: Request,
): Promise<{ fields: Record<string, string>; files: SavedFile[] }> {
  const formData = await request.formData();
  const fields: Record<string, string> = {};
  const savedFiles: SavedFile[] = [];

  // Extract text fields first (needed for userId in the filename)
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string') {
      fields[key] = value;
    }
  }

  const userId = fields.userId ?? 'unknown';

  // Process file entries
  const fileEntries: File[] = [];
  for (const [, value] of formData.entries()) {
    if (value instanceof File && value.size > 0) {
      fileEntries.push(value);
    }
  }

  if (fileEntries.length > MAX_FILES_PER_SUBMISSION) {
    throw new KYCError(
      `Too many files. Maximum ${MAX_FILES_PER_SUBMISSION} files allowed.`,
      400,
    );
  }

  for (const file of fileEntries) {
    // Validate MIME type
    if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
      throw new KYCError(
        `Invalid file type "${file.type}". Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`,
        415,
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new KYCError(
        `File "${file.name}" exceeds maximum size of ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB.`,
        413,
      );
    }

    // Build filename: user_[userId]_[timestamp]_[originalName]
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storedName = `user_${userId}_${timestamp}_${safeName}`;

    // Upload file to Pinata private storage
    const arrayBuffer = await file.arrayBuffer();
    const pinataFile = new File([arrayBuffer], storedName, {
      type: file.type,
    });

    const upload = await uploadPrivateFile(pinataFile, {
      userId,
      type: 'kyc',
      originalName: file.name,
    });

    savedFiles.push({
      cid: upload.cid,
      originalName: file.name,
      storedName,
      size: file.size,
      mimeType: file.type,
    });
  }

  return { fields, files: savedFiles };
}
