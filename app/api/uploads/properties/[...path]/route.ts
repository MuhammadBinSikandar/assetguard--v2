/**
 * GET /api/uploads/properties/[...path]
 *
 * Serves uploaded property documents so that admins can
 * view/download them (e.g., /api/uploads/properties/{propertyId}/title_deed.pdf).
 *
 * Access is restricted to admin users only.
 *
 * Supports an optional `download=1` query parameter to force a download
 * (Content-Disposition: attachment) instead of inline viewing.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromAccessToken } from '@/lib/auth';
import path from 'path';
import fs from 'fs';

export const runtime = 'nodejs';

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
  // 1. Auth — admin only
  const decoded = await getUserFromAccessToken();
  if (!decoded) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized. Please log in.' },
      { status: 401 },
    );
  }
  if (!decoded.roles.includes('admin')) {
    return NextResponse.json(
      { success: false, message: 'Forbidden. Admin access required.' },
      { status: 403 },
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

  // 3. Resolve and validate file path is within uploads/properties
  const absolutePath = path.resolve(process.cwd(), 'uploads', 'properties', filename);
  const uploadRoot = path.resolve(process.cwd(), 'uploads', 'properties');
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

  // 4. Serve file
  const ext = path.extname(filename).toLowerCase();
  const contentType = MIME_TYPES[ext] ?? 'application/octet-stream';
  const fileBuffer = fs.readFileSync(absolutePath);

  const download = request.nextUrl.searchParams.get('download') === '1';
  const disposition = download
    ? `attachment; filename="${path.basename(filename)}"`
    : `inline; filename="${path.basename(filename)}"`;

  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Length': fileBuffer.length.toString(),
      'Cache-Control': 'private, max-age=3600',
      'Content-Disposition': disposition,
    },
  });
}
