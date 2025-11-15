import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/db/prismaClient';
import { compareToken } from '@/lib/bcrypt';
import { createAuditLog } from '@/lib/logger';
import { getDeviceInfo } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const deviceInfo = getDeviceInfo(request);

  try {
    // Get token from query parameter
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: 'Verification token is required',
        },
        { status: 400 }
      );
    }

    // Find all email verification tokens and check for match
    const allTokens = await prisma.emailVerificationToken.findMany({
      where: {
        consumed: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });

    let matchedToken = null;
    for (const dbToken of allTokens) {
      const isMatch = await compareToken(token, dbToken.tokenHash);
      if (isMatch) {
        matchedToken = dbToken;
        break;
      }
    }

    if (!matchedToken) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid or expired verification token',
        },
        { status: 400 }
      );
    }

    // Update user to mark email as verified
    await prisma.user.update({
      where: { id: matchedToken.userId },
      data: { emailVerified: true },
    });

    // Mark token as consumed
    await prisma.emailVerificationToken.update({
      where: { id: matchedToken.id },
      data: {
        consumed: true,
        consumedAt: new Date(),
      },
    });

    // Audit log
    await createAuditLog({
      userId: matchedToken.userId,
      action: 'email_verify',
      details: { email: matchedToken.user.email },
      ip: deviceInfo.ip || undefined,
      userAgent: deviceInfo.userAgent || undefined,
      success: true,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Email verified successfully',
        data: {
          email: matchedToken.user.email,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Email verification error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred during email verification',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
