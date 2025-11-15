import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/db/prismaClient';
import { hashPassword, validatePasswordStrength } from '@/lib/bcrypt';
import { hashToken, isValidEmail, generateEmailVerificationToken } from '@/lib/auth';
import { sendVerificationEmail } from '@/lib/email';
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
      // Don't reveal that user exists (security best practice)
      // Send generic success message to prevent email enumeration
      await createAuditLog({
        action: 'register',
        details: { email, reason: 'user_exists' },
        ip: getDeviceInfo(request).ip || undefined,
        userAgent: getDeviceInfo(request).userAgent || undefined,
        success: false,
      });

      return NextResponse.json(
        {
          success: true,
          message: 'If that email is not already registered, a verification email has been sent',
        },
        { status: 200 }
      );
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

    // Generate email verification token
    const { rawToken, expiresAt } = generateEmailVerificationToken();
    const tokenHash = await hashToken(rawToken);

    // Store verification token
    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    // Send verification email
    try {
      await sendVerificationEmail(user.email, rawToken);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
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

    return NextResponse.json(
      {
        success: true,
        message: 'Registration successful. Please check your email to verify your account.',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            emailVerified: user.emailVerified,
          },
        },
      },
      { status: 201 }
    );
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
