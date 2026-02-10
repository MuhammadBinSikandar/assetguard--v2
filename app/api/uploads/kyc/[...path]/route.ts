/**
 * GET /api/uploads/kyc/[...path]
 *
 * Serves uploaded KYC documents as static files so that admins can
 * view them via URL (e.g., /api/uploads/kyc/user_abc_123_passport.png).
 *
 * Access is restricted to:
 *   - Admin users (can view any document)
 *   - The document owner (can view their own documents)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromAccessToken } from '@/lib/auth';
import path from 'path';
import fs from 'fs';

export const runtime = 'nodejs';

// MIME type mapping for common document types
const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  // 1. Auth check
  const decoded = await getUserFromAccessToken();
  if (!decoded) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized. Please log in.' },
      { status: 401 },
    );
  }

  const { path: pathSegments } = await params;
  const filename = pathSegments.join('/');

  // 2. Security: prevent path traversal
  if (filename.includes('..') || filename.includes('~')) {
    return NextResponse.json(
      { success: false, message: 'Invalid file path.' },
      { status: 400 },
    );
  }

  // 3. Ownership check: non-admins can only access their own files
  //    Filename format: user_[userId]_[timestamp]_[originalName]
  if (!decoded.roles.includes('admin')) {
    const ownerMatch = filename.match(/^user_([^_]+)_/);
    if (!ownerMatch || ownerMatch[1] !== decoded.userId) {
      return NextResponse.json(
        { success: false, message: 'Forbidden. You can only access your own documents.' },
        { status: 403 },
      );
    }
  }

  // 4. Resolve and read the file
  const absolutePath = path.resolve(process.cwd(), 'uploads', 'kyc', filename);

  // Double-check the resolved path is still within uploads/kyc
  const uploadRoot = path.resolve(process.cwd(), 'uploads', 'kyc');
  if (!absolutePath.startsWith(uploadRoot)) {
    return NextResponse.json(
      { success: false, message: 'Invalid file path.' },
      { status: 400 },
    );
  }

  if (!fs.existsSync(absolutePath)) {
    return NextResponse.json(
      { success: false, message: 'File not found.' },
      { status: 404 },
    );
  }

  // 5. Read file and serve with correct content type
  const ext = path.extname(filename).toLowerCase();
  const contentType = MIME_TYPES[ext] ?? 'application/octet-stream';
  const fileBuffer = fs.readFileSync(absolutePath);

  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Length': fileBuffer.length.toString(),
      'Cache-Control': 'private, max-age=3600',
      'Content-Disposition': `inline; filename="${path.basename(filename)}"`,
    },
  });
}
