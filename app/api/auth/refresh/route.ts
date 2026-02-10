import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/db/prismaClient';
import {
  verifyRefreshToken,
  createAccessToken,
  createRefreshToken,
  getDeviceInfo,
  COOKIE_OPTIONS,
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
} from '@/lib/auth';
import { hashToken, compareToken } from '@/lib/bcrypt';
import { createAuditLog, securityLog } from '@/lib/logger';
import { checkRateLimit } from '@/lib/rateLimit';
import { sendSecurityAlertEmail } from '@/lib/email';

// Helper to clear auth cookies on a response
function clearCookiesOnResponse(response: NextResponse) {
  response.cookies.delete(ACCESS_COOKIE_NAME);
  response.cookies.delete(REFRESH_COOKIE_NAME);
  response.cookies.delete('csrf_token');
  return response;
}

export async function POST(request: NextRequest) {
  const deviceInfo = getDeviceInfo(request);

  try {
    // Rate limiting
    const rateLimitResult = await checkRateLimit(request, 'refresh');
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Too many refresh requests. Please try again later.',
        },
        { status: 429 }
      );
    }

    // Get refresh token from cookie
    const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;

    if (!refreshToken) {
      return NextResponse.json(
        {
          success: false,
          message: 'No refresh token provided',
        },
        { status: 401 }
      );
    }

    // Verify JWT signature and expiration
    const decoded = verifyRefreshToken(refreshToken);

    if (!decoded) {
      const response = NextResponse.json(
        {
          success: false,
          message: 'Invalid or expired refresh token',
        },
        { status: 401 }
      );
      return clearCookiesOnResponse(response);
    }

    // Find all refresh tokens for this user (to check for reuse)
    const userTokens = await prisma.refreshToken.findMany({
      where: {
        userId: decoded.userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Find the matching token by comparing hashes
    let matchedToken = null;
    for (const dbToken of userTokens) {
      const isMatch = await compareToken(refreshToken, dbToken.hashedToken);
      if (isMatch) {
        matchedToken = dbToken;
        break;
      }
    }

    if (!matchedToken) {
      // Token not found in database - could be:
      // 1. Token was already rotated and this is a reuse attempt
      // 2. Token was revoked
      // 3. Token is invalid

      securityLog('SECURITY ALERT: Refresh token not found in database', {
        userId: decoded.userId,
        jti: decoded.jti,
        ip: deviceInfo.ip,
      });

      // Check if this JTI was previously used (rotation chain)
      const previousToken = await prisma.refreshToken.findFirst({
        where: {
          userId: decoded.userId,
          jti: decoded.jti,
        },
      });

      if (previousToken && previousToken.replacedById) {
        // REUSE DETECTED: Token was already rotated
        // This is a serious security event - revoke ALL user sessions
        securityLog('CRITICAL: Refresh token reuse detected!', {
          userId: decoded.userId,
          tokenId: previousToken.id,
          jti: decoded.jti,
          ip: deviceInfo.ip,
        });

        // Revoke all refresh tokens for this user
        await prisma.refreshToken.updateMany({
          where: {
            userId: decoded.userId,
            revoked: false,
          },
          data: {
            revoked: true,
            revokedAt: new Date(),
            revokedReason: 'reuse_detected',
          },
        });

        // Audit log
        await createAuditLog({
          userId: decoded.userId,
          action: 'token_revoke',
          details: {
            reason: 'reuse_detected',
            jti: decoded.jti,
            revokedAllSessions: true,
          },
          ip: deviceInfo.ip || undefined,
          userAgent: deviceInfo.userAgent || undefined,
          success: true,
        });

        // Send security alert email
        try {
          const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
          });

          if (user) {
            await sendSecurityAlertEmail(
              user.email,
              'We detected suspicious activity on your account. A previously used session token was presented again, which could indicate a security breach. As a precaution, all your active sessions have been terminated. Please log in again and change your password if you did not perform this action.'
            );
          }
        } catch (emailError) {
          console.error('Failed to send security alert email:', emailError);
        }

        const reuseResponse = NextResponse.json(
          {
            success: false,
            message: 'Security alert: Token reuse detected. All sessions have been revoked. Please log in again.',
            code: 'TOKEN_REUSE_DETECTED',
          },
          { status: 401 }
        );
        return clearCookiesOnResponse(reuseResponse);
      }

      // Token not found and no reuse detected - just invalid
      const invalidResponse = NextResponse.json(
        {
          success: false,
          message: 'Invalid refresh token',
        },
        { status: 401 }
      );
      return clearCookiesOnResponse(invalidResponse);
    }

    // Check if token is revoked
    if (matchedToken.revoked) {
      await createAuditLog({
        userId: decoded.userId,
        action: 'token_refresh',
        details: { reason: 'token_revoked', revokedReason: matchedToken.revokedReason },
        ip: deviceInfo.ip || undefined,
        userAgent: deviceInfo.userAgent || undefined,
        success: false,
      });

      const revokedResponse = NextResponse.json(
        {
          success: false,
          message: 'Refresh token has been revoked',
        },
        { status: 401 }
      );
      return clearCookiesOnResponse(revokedResponse);
    }

    // Check if token is expired
    if (matchedToken.expiresAt < new Date()) {
      const expiredResponse = NextResponse.json(
        {
          success: false,
          message: 'Refresh token has expired',
        },
        { status: 401 }
      );
      return clearCookiesOnResponse(expiredResponse);
    }

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      const noUserResponse = NextResponse.json(
        {
          success: false,
          message: 'User not found',
        },
        { status: 401 }
      );
      return clearCookiesOnResponse(noUserResponse);
    }

    // TOKEN ROTATION: Create new tokens
    const { token: newAccessToken, expiresAt: accessExpiry } = createAccessToken({
      userId: user.id,
      email: user.email,
      roles: user.roles,
      emailVerified: user.emailVerified,
    });

    // Maintain the same expiration duration for refresh token (check if it was long-lived)
    const wasLongLived = matchedToken.expiresAt.getTime() - matchedToken.createdAt.getTime() > 7 * 24 * 60 * 60 * 1000;
    const newRefreshTokenData = createRefreshToken(user.id, wasLongLived);
    const hashedNewRefreshToken = await hashToken(newRefreshTokenData.token);

    // Create new refresh token record
    const newRefreshTokenRecord = await prisma.refreshToken.create({
      data: {
        userId: user.id,
        hashedToken: hashedNewRefreshToken,
        jti: newRefreshTokenData.jti,
        device: deviceInfo.device,
        ip: deviceInfo.ip,
        userAgent: deviceInfo.userAgent,
        expiresAt: newRefreshTokenData.expiresAt,
      },
    });

    // Mark old token as replaced
    await prisma.refreshToken.update({
      where: { id: matchedToken.id },
      data: {
        revoked: true,
        revokedAt: new Date(),
        revokedReason: 'rotated',
        replacedById: newRefreshTokenRecord.id,
      },
    });

    // Create response with new cookies
    const response = NextResponse.json(
      {
        success: true,
        message: 'Token refreshed successfully',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            roles: user.roles,
            emailVerified: user.emailVerified,
          },
          accessTokenExpiresAt: accessExpiry.toISOString(),
        },
      },
      { status: 200 }
    );

    // Set new cookies on response
    response.cookies.set(ACCESS_COOKIE_NAME, newAccessToken, {
      ...COOKIE_OPTIONS,
      expires: accessExpiry,
    });
    
    response.cookies.set(REFRESH_COOKIE_NAME, newRefreshTokenData.token, {
      ...COOKIE_OPTIONS,
      expires: newRefreshTokenData.expiresAt,
    });

    // Audit log
    await createAuditLog({
      userId: user.id,
      action: 'token_refresh',
      details: {
        oldTokenId: matchedToken.id,
        newTokenId: newRefreshTokenRecord.id,
      },
      ip: deviceInfo.ip || undefined,
      userAgent: deviceInfo.userAgent || undefined,
      success: true,
    });

    return response;
  } catch (error) {
    console.error('Refresh token error:', error);

    await createAuditLog({
      action: 'token_refresh',
      details: { error: error instanceof Error ? error.message : 'Unknown error' },
      ip: deviceInfo.ip || undefined,
      userAgent: deviceInfo.userAgent || undefined,
      success: false,
    });

    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while refreshing token',
      },
      { status: 500 }
    );
  }
}
