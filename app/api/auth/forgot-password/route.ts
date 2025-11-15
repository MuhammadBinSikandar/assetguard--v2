import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/db/prismaClient';
import { generatePasswordResetToken, getDeviceInfo } from '@/lib/auth';
import { hashToken } from '@/lib/bcrypt';
import { sendPasswordResetEmail } from '@/lib/email';
import { checkRateLimit } from '@/lib/rateLimit';
import { createAuditLog } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const deviceInfo = getDeviceInfo(request);

  try {
    // Rate limiting
    const rateLimitResult = await checkRateLimit(request, 'forgotPassword');
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Too many password reset requests. Please try again later.',
        },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email is required',
        },
        { status: 400 }
      );
    }

    // Generic success message to prevent email enumeration
    const genericMessage =
      'If that email address is registered, a password reset link has been sent.';

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Don't reveal that user doesn't exist
      await createAuditLog({
        action: 'password_reset',
        details: { email, reason: 'user_not_found' },
        ip: deviceInfo.ip || undefined,
        userAgent: deviceInfo.userAgent || undefined,
        success: false,
      });

      return NextResponse.json(
        {
          success: true,
          message: genericMessage,
        },
        { status: 200 }
      );
    }

    // Invalidate any existing non-consumed password reset tokens for this user
    await prisma.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        consumed: false,
      },
      data: {
        consumed: true,
        consumedAt: new Date(),
      },
    });

    // Generate password reset token
    const { rawToken, expiresAt } = generatePasswordResetToken();
    const tokenHash = await hashToken(rawToken);

    // Store reset token
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
        ip: deviceInfo.ip,
        userAgent: deviceInfo.userAgent,
      },
    });

    // Send password reset email
    try {
      await sendPasswordResetEmail(user.email, rawToken);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      // Don't fail the request if email fails
    }

    // Audit log
    await createAuditLog({
      userId: user.id,
      action: 'password_reset',
      details: { email: user.email, stage: 'request' },
      ip: deviceInfo.ip || undefined,
      userAgent: deviceInfo.userAgent || undefined,
      success: true,
    });

    return NextResponse.json(
      {
        success: true,
        message: genericMessage,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Forgot password error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred. Please try again.',
      },
      { status: 500 }
    );
  }
}
