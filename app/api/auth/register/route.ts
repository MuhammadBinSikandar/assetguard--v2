import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/db/prismaClient';
import { hashPassword, validatePasswordStrength, hashToken } from '@/lib/bcrypt';
import { isValidEmail, generateOTP } from '@/lib/auth';
import { sendVerificationOTP } from '@/lib/email';
import { checkRateLimit } from '@/lib/rateLimit';
import { createAuditLog } from '@/lib/logger';
import { getDeviceInfo } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await checkRateLimit(request, 'register');
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: rateLimitResult.lockedUntil
            ? 'Too many registration attempts. Please try again later.'
            : 'Rate limit exceeded. Please try again later.',
          retryAfter: rateLimitResult.resetAt,
        },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { email, password, name, role } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email and password are required',
        },
        { status: 400 }
      );
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid email format',
        },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          message: 'Password does not meet requirements',
          errors: passwordValidation.errors,
        },
        { status: 400 }
      );
    }

    // Validate role if provided
    const validRoles = ['user', 'buyer', 'seller'];
    const userRoles = role && validRoles.includes(role) ? ['user', role] : ['user'];

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      await createAuditLog({
        action: 'register',
        details: { email, reason: 'user_exists', emailVerified: existingUser.emailVerified },
        ip: getDeviceInfo(request).ip || undefined,
        userAgent: getDeviceInfo(request).userAgent || undefined,
        success: false,
      });

      // If user exists and is verified, tell them to login
      if (existingUser.emailVerified) {
        return NextResponse.json(
          {
            success: false,
            message: 'This email is already registered. Please log in instead.',
            code: 'EMAIL_EXISTS',
          },
          { status: 409 }
        );
      }

      // If user exists but not verified, resend OTP
      const { otpCode, expiresAt } = generateOTP();
      const otpHash = await hashToken(otpCode);

      // Invalidate old tokens and create new one
      await prisma.emailVerificationToken.updateMany({
        where: { userId: existingUser.id, consumed: false },
        data: { consumed: true, consumedAt: new Date() },
      });

      await prisma.emailVerificationToken.create({
        data: {
          userId: existingUser.id,
          otpCode: otpHash,
          expiresAt,
        },
      });

      // Send new verification OTP
      try {
        await sendVerificationOTP(existingUser.email, otpCode);
      } catch (emailError) {
        console.error('Failed to resend verification OTP:', emailError);
      }

      const response = NextResponse.json(
        {
          success: true,
          message: 'This email is already registered but not verified. A new verification code has been sent.',
          data: {
            userId: existingUser.id,
            requiresVerification: true,
          },
        },
        { status: 200 }
      );

      // Set cookie for verification
      response.cookies.set('pending_verification_email', existingUser.email, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60, // 1 hour
        path: '/',
      });

      return response;
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        name: name || null,
        roles: userRoles,
        emailVerified: false,
      },
    });

    // Generate 6-digit OTP
    const { otpCode, expiresAt } = generateOTP();
    const otpHash = await hashToken(otpCode);

    // Store OTP verification token
    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        otpCode: otpHash,
        expiresAt,
      },
    });

    // Send verification OTP email
    try {
      await sendVerificationOTP(user.email, otpCode);
    } catch (emailError) {
      console.error('Failed to send verification OTP:', emailError);
      // Don't fail registration if email fails
      // Log the error and continue
    }

    // Audit log
    await createAuditLog({
      userId: user.id,
      action: 'register',
      details: { email: user.email, roles: user.roles },
      ip: getDeviceInfo(request).ip || undefined,
      userAgent: getDeviceInfo(request).userAgent || undefined,
      success: true,
    });

    const response = NextResponse.json(
      {
        success: true,
        message: 'Registration successful. A 6-digit verification code has been sent to your email.',
        data: {
          userId: user.id,
          requiresVerification: true,
        },
      },
      { status: 201 }
    );

    // Store email in secure, HTTP-only cookie for verification (expires in 1 hour)
    response.cookies.set('pending_verification_email', user.email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60, // 1 hour
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Registration error:', error);

    await createAuditLog({
      action: 'register',
      details: { error: error instanceof Error ? error.message : 'Unknown error' },
      ip: getDeviceInfo(request).ip || undefined,
      userAgent: getDeviceInfo(request).userAgent || undefined,
      success: false,
    });

    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred during registration. Please try again.',
      },
      { status: 500 }
    );
  }
}
