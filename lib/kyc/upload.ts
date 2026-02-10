/**
 * KYC File Upload Middleware
 *
 * Uses Multer for file handling with custom storage configuration.
 * Files are stored locally in ./uploads/kyc/ with the format:
 *   user_[userId]_[timestamp]_[originalName]
 *
 * For Next.js App Router API routes we also export a helper that
 * parses a native Web `Request` FormData and pipes it through Multer
 * via an in-memory Express-like shim.
 */

import multer, { type StorageEngine, type FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { IncomingMessage, ServerResponse } from 'http';
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

// ── Multer disk storage ──────────────────────────────────────────────────────

/**
 * Custom Multer storage engine.
 * Filenames follow the pattern: user_[userId]_[timestamp]_[originalName]
 *
 * userId is extracted from the `body.userId` field of the multipart form.
 */
const kycStorage: StorageEngine = multer.diskStorage({
  destination(_req, _file, cb) {
    ensureUploadDir();
    cb(null, absoluteUploadDir);
  },

  filename(req, file, cb) {
    const userId: string = (req as unknown as { body: { userId?: string } }).body?.userId ?? 'unknown';
    const timestamp = Date.now();
    // Sanitise original name: replace spaces & special chars
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `user_${userId}_${timestamp}_${safeName}`);
  },
});

// ── File filter ──────────────────────────────────────────────────────────────

function kycFileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
): void {
  if ((ALLOWED_MIME_TYPES as readonly string[]).includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new KYCError(
        `Invalid file type "${file.mimetype}". Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`,
        415,
      ),
    );
  }
}

// ── Multer instance (Express-compatible) ─────────────────────────────────────

export const kycUpload = multer({
  storage: kycStorage,
  fileFilter: kycFileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: MAX_FILES_PER_SUBMISSION,
  },
});

// ── Next.js App Router helper ────────────────────────────────────────────────

/**
 * Parse a native Web `Request` (Next.js App Router) through Multer.
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

// ── Express middleware runner (utility) ──────────────────────────────────────

/**
 * Promise wrapper for running Multer as Express middleware.
 * Useful if you ever mount a custom Express server alongside Next.js.
 */
export function runMulterMiddleware(
  req: IncomingMessage & { body?: Record<string, unknown>; files?: Express.Multer.File[] },
  res: ServerResponse,
): Promise<Express.Multer.File[]> {
  return new Promise((resolve, reject) => {
    const mw = kycUpload.array('documents', MAX_FILES_PER_SUBMISSION);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mw(req as any, res as any, (err: unknown) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            reject(new KYCError(`File too large. Max ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB.`, 413));
          } else if (err.code === 'LIMIT_FILE_COUNT') {
            reject(new KYCError(`Too many files. Max ${MAX_FILES_PER_SUBMISSION}.`, 400));
          } else {
            reject(new KYCError(`Upload error: ${err.message}`, 400));
          }
        } else {
          reject(err);
        }
        return;
      }
      resolve((req.files as Express.Multer.File[]) ?? []);
    });
  });
}
