import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/db/prismaClient';
import { compareToken } from '@/lib/bcrypt';
import { createAuditLog } from '@/lib/logger';
import { getDeviceInfo } from '@/lib/auth';
import { checkRateLimit, resetRateLimit } from '@/lib/rateLimit';

const MAX_OTP_ATTEMPTS = 5;

export async function POST(request: NextRequest) {
  try {
    // Rate limiting to prevent brute-force OTP attacks
    const rateLimitResult = await checkRateLimit(request, 'verifyOtp');
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: rateLimitResult.lockedUntil
            ? 'Too many verification attempts. Please try again later.'
            : 'Rate limit exceeded. Please slow down.',
          retryAfter: rateLimitResult.resetAt,
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email, otpCode } = body;

    // Validate required fields
    if (!email || !otpCode) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email and OTP code are required',
        },
        { status: 400 }
      );
    }

    // Validate OTP format (6 digits)
    if (!/^\d{6}$/.test(otpCode)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid OTP format. Please enter a 6-digit code.',
        },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found',
        },
        { status: 404 }
      );
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json(
        {
          success: true,
          message: 'Email already verified',
        },
        { status: 200 }
      );
    }

    // Find the most recent non-consumed OTP token for this user
    const verificationToken = await prisma.emailVerificationToken.findFirst({
      where: {
        userId: user.id,
        consumed: false,
        otpCode: {
          not: null,
        },
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!verificationToken || !verificationToken.otpCode) {
      return NextResponse.json(
        {
          success: false,
          message: 'No valid verification code found. Please request a new one.',
        },
        { status: 404 }
      );
    }

    // Check if too many attempts
    if (verificationToken.attempts >= MAX_OTP_ATTEMPTS) {
      // Invalidate this token
      await prisma.emailVerificationToken.update({
        where: { id: verificationToken.id },
        data: {
          consumed: true,
          consumedAt: new Date(),
        },
      });

      await createAuditLog({
        userId: user.id,
        action: 'email_verify',
        details: { reason: 'too_many_attempts' },
        ip: getDeviceInfo(request).ip || undefined,
        userAgent: getDeviceInfo(request).userAgent || undefined,
        success: false,
      });

      return NextResponse.json(
        {
          success: false,
          message: 'Too many failed attempts. Please request a new verification code.',
        },
        { status: 429 }
      );
    }

    // Verify OTP
    const isValidOTP = await compareToken(otpCode, verificationToken.otpCode);

    if (!isValidOTP) {
      // Increment attempt counter
      await prisma.emailVerificationToken.update({
        where: { id: verificationToken.id },
        data: {
          attempts: verificationToken.attempts + 1,
        },
      });

      const remainingAttempts = MAX_OTP_ATTEMPTS - (verificationToken.attempts + 1);

      await createAuditLog({
        userId: user.id,
        action: 'email_verify',
        details: { reason: 'invalid_otp', remainingAttempts },
        ip: getDeviceInfo(request).ip || undefined,
        userAgent: getDeviceInfo(request).userAgent || undefined,
        success: false,
      });

      return NextResponse.json(
        {
          success: false,
          message: `Invalid verification code. ${remainingAttempts} attempts remaining.`,
        },
        { status: 401 }
      );
    }

    // OTP is valid - mark user as verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
      },
    });

    // Mark token as consumed
    await prisma.emailVerificationToken.update({
      where: { id: verificationToken.id },
      data: {
        consumed: true,
        consumedAt: new Date(),
      },
    });

    // Reset rate limit on successful verification
    const deviceInfo = getDeviceInfo(request);
    if (deviceInfo.ip) {
      resetRateLimit(deviceInfo.ip, 'verifyOtp');
    }

    // Audit log
    await createAuditLog({
      userId: user.id,
      action: 'email_verify',
      details: { email: user.email },
      ip: getDeviceInfo(request).ip || undefined,
      userAgent: getDeviceInfo(request).userAgent || undefined,
      success: true,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Email verified successfully! You can now log in.',
        data: {
          user: {
            id: user.id,
            email: user.email,
            emailVerified: true,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('OTP verification error:', error);

    await createAuditLog({
      action: 'email_verify',
      details: { error: error instanceof Error ? error.message : 'Unknown error' },
      ip: getDeviceInfo(request).ip || undefined,
      userAgent: getDeviceInfo(request).userAgent || undefined,
      success: false,
    });

    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred during verification. Please try again.',
      },
      { status: 500 }
    );
  }
}
