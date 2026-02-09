import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/db/prismaClient';
import { hashToken } from '@/lib/bcrypt';
import { generateOTP } from '@/lib/auth';
import { sendVerificationOTP } from '@/lib/email';
import { checkRateLimit } from '@/lib/rateLimit';
import { createAuditLog } from '@/lib/logger';
import { getDeviceInfo } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await checkRateLimit(request, 'resend_otp');
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Too many resend attempts. Please try again later.',
          retryAfter: rateLimitResult.resetAt,
        },
        { status: 429 }
      );
    }

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

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Don't reveal that user doesn't exist
      return NextResponse.json(
        {
          success: true,
          message: 'If the email is registered, a new verification code has been sent.',
        },
        { status: 200 }
      );
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json(
        {
          success: true,
          message: 'Email is already verified',
        },
        { status: 200 }
      );
    }

    // Invalidate all previous OTP tokens for this user
    await prisma.emailVerificationToken.updateMany({
      where: {
        userId: user.id,
        consumed: false,
      },
      data: {
        consumed: true,
        consumedAt: new Date(),
      },
    });

    // Generate new OTP
    const { otpCode, expiresAt } = generateOTP();
    const otpHash = await hashToken(otpCode);

    // Store new OTP
    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        otpCode: otpHash,
        expiresAt,
      },
    });

    // Send OTP email
    try {
      await sendVerificationOTP(user.email, otpCode);
    } catch (emailError) {
      console.error('Failed to send verification OTP:', emailError);
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to send verification code. Please try again.',
        },
        { status: 500 }
      );
    }

    // Audit log
    await createAuditLog({
      userId: user.id,
      action: 'resend_otp',
      details: { email: user.email },
      ip: getDeviceInfo(request).ip || undefined,
      userAgent: getDeviceInfo(request).userAgent || undefined,
      success: true,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'A new verification code has been sent to your email.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Resend OTP error:', error);

    await createAuditLog({
      action: 'resend_otp',
      details: { error: error instanceof Error ? error.message : 'Unknown error' },
      ip: getDeviceInfo(request).ip || undefined,
      userAgent: getDeviceInfo(request).userAgent || undefined,
      success: false,
    });

    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred. Please try again.',
      },
      { status: 500 }
    );
  }
}
