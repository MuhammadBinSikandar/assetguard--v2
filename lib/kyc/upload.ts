/**
 * KYC File Upload Handler
 *
 * Uses the native Web FormData API (Next.js App Router compatible).
 * Files are stored locally in ./uploads/kyc/ with the format:
 *   user_[userId]_[timestamp]_[originalName]
 */

import path from 'path';
import fs from 'fs';
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  MAX_FILES_PER_SUBMISSION,
  UPLOAD_DIR,
  UPLOAD_URL_PREFIX,
  KYCError,
  type SavedFile,
} from './types';

// ── Ensure upload directory exists ───────────────────────────────────────────

const absoluteUploadDir = path.resolve(process.cwd(), UPLOAD_DIR);

function ensureUploadDir(): void {
  if (!fs.existsSync(absoluteUploadDir)) {
    fs.mkdirSync(absoluteUploadDir, { recursive: true });
  }
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
  ensureUploadDir();

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
    const filePath = path.join(absoluteUploadDir, storedName);

    // Write file to disk
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(filePath, buffer);

    savedFiles.push({
      originalName: file.name,
      storedName,
      relativePath: `${UPLOAD_URL_PREFIX}/${storedName}`,
      size: file.size,
      mimeType: file.type,
    });
  }

  return { fields, files: savedFiles };
}
