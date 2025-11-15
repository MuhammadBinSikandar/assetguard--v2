import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/db/prismaClient';
import { comparePassword } from '@/lib/bcrypt';
import {
  createAccessToken,
  createRefreshToken,
  setAccessTokenCookie,
  setRefreshTokenCookie,
  isAccountLocked,
  calculateLockoutDuration,
  getDeviceInfo,
} from '@/lib/auth';
import { hashToken } from '@/lib/bcrypt';
import { checkRateLimit, resetRateLimit } from '@/lib/rateLimit';
import { createAuditLog, securityLog } from '@/lib/logger';
import { initializeCSRF } from '@/lib/csrf';
import ms from 'ms';

const MAX_FAILED_ATTEMPTS = 5;

export async function POST(request: NextRequest) {
  const deviceInfo = getDeviceInfo(request);

  try {
    // Rate limiting
    const rateLimitResult = await checkRateLimit(request, 'login');
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: rateLimitResult.lockedUntil
            ? 'Account temporarily locked due to too many failed attempts. Please try again later.'
            : 'Too many login attempts. Please try again later.',
          retryAfter: rateLimitResult.resetAt,
        },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { email, password, rememberMe } = body;

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

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Generic error message to prevent user enumeration
    const invalidCredentialsMessage = 'Invalid email or password';

    if (!user) {
      await createAuditLog({
        action: 'failed_login',
        details: { email, reason: 'user_not_found' },
        ip: deviceInfo.ip || undefined,
        userAgent: deviceInfo.userAgent || undefined,
        success: false,
      });

      return NextResponse.json(
        {
          success: false,
          message: invalidCredentialsMessage,
        },
        { status: 401 }
      );
    }

    // Check if account is locked
    if (isAccountLocked(user.lockedUntil)) {
      await createAuditLog({
        userId: user.id,
        action: 'failed_login',
        details: { reason: 'account_locked', lockedUntil: user.lockedUntil },
        ip: deviceInfo.ip || undefined,
        userAgent: deviceInfo.userAgent || undefined,
        success: false,
      });

      return NextResponse.json(
        {
          success: false,
          message: 'Account is temporarily locked. Please try again later.',
        },
        { status: 403 }
      );
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.passwordHash);

    if (!isValidPassword) {
      // Increment failed login attempts
      const newFailedAttempts = user.failedLoginAttempts + 1;
      const lockoutDuration = calculateLockoutDuration(newFailedAttempts);
      const lockedUntil = lockoutDuration > 0 ? new Date(Date.now() + lockoutDuration) : null;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: newFailedAttempts,
          lockedUntil,
        },
      });

      if (lockedUntil) {
        securityLog(`Account locked for user ${user.email} due to ${newFailedAttempts} failed attempts`);
      }

      await createAuditLog({
        userId: user.id,
        action: 'failed_login',
        details: {
          reason: 'invalid_password',
          failedAttempts: newFailedAttempts,
          locked: !!lockedUntil,
        },
        ip: deviceInfo.ip || undefined,
        userAgent: deviceInfo.userAgent || undefined,
        success: false,
      });

      return NextResponse.json(
        {
          success: false,
          message: invalidCredentialsMessage,
        },
        { status: 401 }
      );
    }

    // Check if email is verified (optional: enforce this)
    // Uncomment to require email verification before login
    // if (!user.emailVerified) {
    //   return NextResponse.json(
    //     {
    //       success: false,
    //       message: 'Please verify your email before logging in',
    //     },
    //     { status: 403 }
    //   );
    // }

    // Successful login - reset failed attempts
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });
    }

    // Create access token
    const { token: accessToken, expiresAt: accessExpiry, jti: accessJti } = createAccessToken({
      userId: user.id,
      email: user.email,
      roles: user.roles,
    });

    // Create refresh token
    const refreshTokenData = createRefreshToken(user.id);
    const hashedRefreshToken = await hashToken(refreshTokenData.token);

    // Store refresh token in database
    const refreshTokenRecord = await prisma.refreshToken.create({
      data: {
        userId: user.id,
        hashedToken: hashedRefreshToken,
        jti: refreshTokenData.jti,
        device: deviceInfo.device,
        ip: deviceInfo.ip,
        userAgent: deviceInfo.userAgent,
        expiresAt: refreshTokenData.expiresAt,
      },
    });

    // Set cookies
    await setAccessTokenCookie(accessToken, accessExpiry);
    await setRefreshTokenCookie(refreshTokenData.token, refreshTokenData.expiresAt);

    // Initialize CSRF token
    const csrfToken = await initializeCSRF();

    // Reset rate limit for this IP
    resetRateLimit(deviceInfo.ip || 'unknown', 'login');

    // Audit log
    await createAuditLog({
      userId: user.id,
      action: 'login',
      details: {
        device: deviceInfo.device,
        refreshTokenId: refreshTokenRecord.id,
      },
      ip: deviceInfo.ip || undefined,
      userAgent: deviceInfo.userAgent || undefined,
      success: true,
    });

    // Clean up old expired sessions for this user
    await prisma.refreshToken.deleteMany({
      where: {
        userId: user.id,
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    // Enforce max sessions per user
    const maxSessions = parseInt(process.env.MAX_SESSIONS_PER_USER || '5', 10);
    const userSessions = await prisma.refreshToken.count({
      where: {
        userId: user.id,
        revoked: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (userSessions > maxSessions) {
      // Revoke oldest sessions
      const sessionsToRevoke = await prisma.refreshToken.findMany({
        where: {
          userId: user.id,
          revoked: false,
        },
        orderBy: {
          createdAt: 'asc',
        },
        take: userSessions - maxSessions,
      });

      await prisma.refreshToken.updateMany({
        where: {
          id: {
            in: sessionsToRevoke.map((s) => s.id),
          },
        },
        data: {
          revoked: true,
          revokedAt: new Date(),
          revokedReason: 'max_sessions_exceeded',
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            roles: user.roles,
            emailVerified: user.emailVerified,
          },
          accessTokenExpiresAt: accessExpiry.toISOString(),
          csrfToken,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);

    await createAuditLog({
      action: 'failed_login',
      details: { error: error instanceof Error ? error.message : 'Unknown error' },
      ip: deviceInfo.ip || undefined,
      userAgent: deviceInfo.userAgent || undefined,
      success: false,
    });

    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred during login. Please try again.',
      },
      { status: 500 }
    );
  }
}
