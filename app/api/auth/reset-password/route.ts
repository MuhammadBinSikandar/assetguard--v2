import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/db/prismaClient';
import { hashPassword, validatePasswordStrength, compareToken } from '@/lib/bcrypt';
import { checkRateLimit } from '@/lib/rateLimit';
import { createAuditLog, securityLog } from '@/lib/logger';
import { getDeviceInfo } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const deviceInfo = getDeviceInfo(request);

  try {
    // Rate limiting
    const rateLimitResult = await checkRateLimit(request, 'resetPassword');
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Too many password reset attempts. Please try again later.',
        },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { token, newPassword } = body;

    if (!token || !newPassword) {
      return NextResponse.json(
        {
          success: false,
          message: 'Token and new password are required',
        },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(newPassword);
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

    // Find all non-consumed, non-expired password reset tokens
    const allTokens = await prisma.passwordResetToken.findMany({
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

    // Find matching token
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
          message: 'Invalid or expired password reset token',
        },
        { status: 400 }
      );
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update user password
    await prisma.user.update({
      where: { id: matchedToken.userId },
      data: {
        passwordHash: newPasswordHash,
        // Reset failed login attempts
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    // Mark token as consumed
    await prisma.passwordResetToken.update({
      where: { id: matchedToken.id },
      data: {
        consumed: true,
        consumedAt: new Date(),
      },
    });

    // Revoke all existing refresh tokens (force re-login everywhere)
    const revokedTokens = await prisma.refreshToken.updateMany({
      where: {
        userId: matchedToken.userId,
        revoked: false,
      },
      data: {
        revoked: true,
        revokedAt: new Date(),
        revokedReason: 'password_reset',
      },
    });

    securityLog('Password reset completed', {
      userId: matchedToken.userId,
      revokedSessions: revokedTokens.count,
    });

    // Audit log
    await createAuditLog({
      userId: matchedToken.userId,
      action: 'password_reset',
      details: {
        email: matchedToken.user.email,
        stage: 'complete',
        revokedSessions: revokedTokens.count,
      },
      ip: deviceInfo.ip || undefined,
      userAgent: deviceInfo.userAgent || undefined,
      success: true,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Password reset successful. Please log in with your new password.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Reset password error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while resetting your password',
      },
      { status: 500 }
    );
  }
}
