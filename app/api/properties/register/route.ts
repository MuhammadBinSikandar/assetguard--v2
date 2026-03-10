import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/db/prismaClient';
import { getUserFromAccessToken } from '@/lib/auth';
import { propertyRegistrationSchema } from '@/lib/validations/property';
import { generatePropertyReferenceId } from '@/lib/generateReferenceId';
import { apiLogger } from '@/lib/debug-logger';
import path from 'path';
import fs from 'fs';

export const runtime = 'nodejs';

const SOLANA_BASE58_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(request: NextRequest) {
  try {
    apiLogger.request('POST', '/api/properties/register');

    // 1. Authenticate
    const decoded = await getUserFromAccessToken();
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Please log in.' },
        { status: 401 },
      );
    }

    // 2. Fetch user from DB to get walletAddress — NEVER accept wallet from client
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, walletAddress: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found.' },
        { status: 404 },
      );
    }

    // 3. Validate walletAddress
    if (!user.walletAddress || !SOLANA_BASE58_REGEX.test(user.walletAddress)) {
      return NextResponse.json(
        { success: false, message: 'Valid Solana wallet address is required. Please connect your wallet first.' },
        { status: 400 },
      );
    }

    // 4. Parse multipart form data
    const formData = await request.formData();

    // Extract text fields
    const rawFields: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      if (typeof value === 'string') {
        rawFields[key] = value;
      }
    }

    // Helper: convert to number only when the string is a valid finite number
    const toNum = (val: string | undefined): number | undefined => {
      if (!val) return undefined;
      const n = Number(val);
      return Number.isFinite(n) ? n : undefined;
    };

    // Convert numeric fields
    const parsed = {
      ...rawFields,
      yearBuilt: toNum(rawFields.yearBuilt),
      stories: toNum(rawFields.stories),
      totalAreaSqFt: toNum(rawFields.totalAreaSqFt),
      commercialUnits: toNum(rawFields.commercialUnits),
      residentialUnits: toNum(rawFields.residentialUnits),
      frontage: toNum(rawFields.frontage),
      depth: toNum(rawFields.depth),
      landAreaSqFt: toNum(rawFields.landAreaSqFt),
      estimatedPriceUSD: toNum(rawFields.estimatedPriceUSD),
    };

    // 4b. Validate via Zod
    const validation = propertyRegistrationSchema.safeParse(parsed);
    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors;
      console.error('[Property Register] Validation errors:', JSON.stringify(fieldErrors));
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed.',
          errors: fieldErrors,
        },
        { status: 400 },
      );
    }

    const data = validation.data;

    // 5. Check for duplicate BBL
    const existing = await prisma.property.findUnique({
      where: {
        borough_block_lot: {
          borough: data.borough,
          block: data.block,
          lot: data.lot,
        },
      },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'A property with this Borough-Block-Lot already exists.' },
        { status: 409 },
      );
    }

    // 6. Handle file upload
    const file = formData.get('document') as File | null;
    if (!file || file.size === 0) {
      return NextResponse.json(
        { success: false, message: 'A title deed document is required.' },
        { status: 400 },
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: `Invalid file type "${file.type}". Allowed: ${ALLOWED_MIME_TYPES.join(', ')}` },
        { status: 415 },
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, message: `File exceeds maximum size of ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB.` },
        { status: 413 },
      );
    }

    // Generate reference ID
    const referenceId = generatePropertyReferenceId();
    const propertyId = crypto.randomUUID();

    // Save file to disk (local uploads/ folder, matching KYC pattern)
    const ext = path.extname(file.name).toLowerCase() || '.pdf';
    const safeName = `title_deed${ext}`;
    const uploadDir = path.join(process.cwd(), 'uploads', 'properties', propertyId);
    fs.mkdirSync(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, safeName);
    const arrayBuffer = await file.arrayBuffer();
    fs.writeFileSync(filePath, Buffer.from(arrayBuffer));

    const fileUrl = `/uploads/properties/${propertyId}/${safeName}`;

    // 7-9. Create Property, Document, and StatusHistory in a transaction
    const property = await prisma.$transaction(async (tx) => {
      const prop = await tx.property.create({
        data: {
          id: propertyId,
          referenceId,
          borough: data.borough,
          block: data.block,
          lot: data.lot,
          propertyAddress: data.propertyAddress,
          ownerName: data.ownerName,
          propertyType: data.propertyType,
          taxClass: data.taxClass,
          yearBuilt: data.yearBuilt,
          stories: data.stories,
          totalAreaSqFt: data.totalAreaSqFt,
          commercialUnits: data.commercialUnits,
          residentialUnits: data.residentialUnits,
          frontage: data.frontage,
          depth: data.depth,
          landAreaSqFt: data.landAreaSqFt,
          estimatedPriceUSD: data.estimatedPriceUSD,
          walletAddress: user.walletAddress!,
          ownerId: user.id,
          status: 'PENDING',
        },
      });

      await tx.propertyDocument.create({
        data: {
          propertyId: prop.id,
          documentType: 'title_deed',
          fileName: file.name,
          fileUrl,
          mimeType: file.type,
          fileSizeBytes: file.size,
          status: 'PENDING',
        },
      });

      await tx.propertyStatusHistory.create({
        data: {
          propertyId: prop.id,
          fromStatus: null,
          toStatus: 'PENDING',
          changedBy: user.id,
        },
      });

      return prop;
    });

    // 10. Return response
    const wallet = user.walletAddress!;
    const truncatedWallet = `${wallet.slice(0, 4)}...${wallet.slice(-3)}`;

    apiLogger.response('POST', '/api/properties/register', 201, true);

    return NextResponse.json(
      {
        success: true,
        message: 'Property registration submitted successfully.',
        data: {
          referenceId: property.referenceId,
          walletAddress: truncatedWallet,
          status: 'PENDING',
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('[Properties Register] Error:', error);
    apiLogger.error('POST', '/api/properties/register', error instanceof Error ? error.message : 'Unknown error');

    return NextResponse.json(
      { success: false, message: 'An error occurred while registering the property.' },
      { status: 500 },
    );
  }
}
