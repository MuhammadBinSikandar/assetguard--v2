import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/db/prismaClient';
import { comparePassword } from '@/lib/bcrypt';
import {
  createAccessToken,
  createRefreshToken,
  isAccountLocked,
  calculateLockoutDuration,
  getDeviceInfo,
  COOKIE_OPTIONS,
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
} from '@/lib/auth';
import { hashToken } from '@/lib/bcrypt';
import { checkRateLimit, resetRateLimit } from '@/lib/rateLimit';
import { createAuditLog, securityLog } from '@/lib/logger';
import { generateCSRFToken } from '@/lib/csrf';
import { authLogger, persistentLogger } from '@/lib/debug-logger';

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

    // Log login attempt
    authLogger.loginAttempt(email, deviceInfo.ip || undefined);

    // Validate required fields
    if (!email || !password) {
      authLogger.loginFailure(email, 'Missing credentials', deviceInfo.ip || undefined);
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
      authLogger.loginFailure(email, 'User not found', deviceInfo.ip || undefined);
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
      authLogger.loginFailure(email, 'Account locked', deviceInfo.ip || undefined);
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
      authLogger.loginFailure(email, 'Invalid password', deviceInfo.ip || undefined);
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

    // Log successful login
    authLogger.loginSuccess(
      user.id, 
      user.email, 
      user.roles, 
      user.emailVerified, 
      deviceInfo.ip || undefined
    );

    // Create access token
    const { token: accessToken, expiresAt: accessExpiry, jti: accessJti } = createAccessToken({
      userId: user.id,
      email: user.email,
      roles: user.roles,
      emailVerified: user.emailVerified,
    });

    authLogger.tokenCreated(user.id, 'access', accessExpiry);

    // Create refresh token with rememberMe option
    const refreshTokenData = createRefreshToken(user.id, rememberMe || false);
    const hashedRefreshToken = await hashToken(refreshTokenData.token);

    authLogger.tokenCreated(user.id, 'refresh', refreshTokenData.expiresAt);

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

    // Generate CSRF token
    const csrfToken = generateCSRFToken();

    // Reset rate limit for this IP (non-blocking)
    resetRateLimit(deviceInfo.ip || 'unknown', 'login');

    // Run non-critical operations in background (fire-and-forget)
    // This includes audit logging and session cleanup
    Promise.all([
      // Audit log
      createAuditLog({
        userId: user.id,
        action: 'login',
        details: {
          device: deviceInfo.device,
          refreshTokenId: refreshTokenRecord.id,
        },
        ip: deviceInfo.ip || undefined,
        userAgent: deviceInfo.userAgent || undefined,
        success: true,
      }),
      // Clean up old expired sessions for this user
      prisma.refreshToken.deleteMany({
        where: {
          userId: user.id,
          expiresAt: {
            lt: new Date(),
          },
        },
      }),
    ]).catch(err => console.error('Background login tasks failed:', err));

    // Enforce max sessions per user (also in background)
    const maxSessions = parseInt(process.env.MAX_SESSIONS_PER_USER || '5', 10);
    prisma.refreshToken.count({
      where: {
        userId: user.id,
        revoked: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    }).then(async (userSessions) => {
      if (userSessions > maxSessions) {
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
              in: sessionsToRevoke.map((s: { id: string }) => s.id),
            },
          },
          data: {
            revoked: true,
            revokedAt: new Date(),
            revokedReason: 'max_sessions_exceeded',
          },
        });
      }
    }).catch(err => console.error('Session cleanup failed:', err));

    // Create response with cookies
    const response = NextResponse.json(
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

    // Set cookies on response
    response.cookies.set(ACCESS_COOKIE_NAME, accessToken, {
      ...COOKIE_OPTIONS,
      expires: accessExpiry,
    });

    response.cookies.set(REFRESH_COOKIE_NAME, refreshTokenData.token, {
      ...COOKIE_OPTIONS,
      expires: refreshTokenData.expiresAt,
    });

    response.cookies.set('csrf_token', csrfToken, {
      httpOnly: false, // Client needs to read this
      secure: COOKIE_OPTIONS.secure,
      sameSite: COOKIE_OPTIONS.sameSite,
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
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
