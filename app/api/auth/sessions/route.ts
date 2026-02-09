import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/db/prismaClient';
import {
  getUserFromAccessToken,
  getRefreshTokenFromCookies,
  verifyRefreshToken,
  getDeviceInfo,
} from '@/lib/auth';
import { compareToken } from '@/lib/bcrypt';
import { createAuditLog } from '@/lib/logger';

// GET /api/auth/sessions - List all active sessions
export async function GET(request: NextRequest) {
  try {
    // Get user from access token
    const decoded = await getUserFromAccessToken();

    if (!decoded) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    // Get current refresh token to identify current session
    const currentRefreshToken = await getRefreshTokenFromCookies();
    let currentTokenId: string | null = null;

    if (currentRefreshToken) {
      const currentDecoded = verifyRefreshToken(currentRefreshToken);
      if (currentDecoded) {
        const userTokens = await prisma.refreshToken.findMany({
          where: {
            userId: decoded.userId,
            revoked: false,
          },
        });

        for (const dbToken of userTokens) {
          const isMatch = await compareToken(currentRefreshToken, dbToken.hashedToken);
          if (isMatch) {
            currentTokenId = dbToken.id;
            break;
          }
        }
      }
    }

    // Fetch all active sessions
    const sessions = await prisma.refreshToken.findMany({
      where: {
        userId: decoded.userId,
        revoked: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        device: true,
        ip: true,
        createdAt: true,
        expiresAt: true,
        userAgent: true,
      },
    });

    // Format sessions with current indicator
    const formattedSessions = sessions.map((session: {
      id: string;
      device: string | null;
      ip: string | null;
      createdAt: Date;
      expiresAt: Date;
      userAgent: string | null;
    }) => ({
      id: session.id,
      device: session.device || 'Unknown Device',
      ip: session.ip || 'Unknown IP',
      createdAt: session.createdAt.toISOString(),
      expiresAt: session.expiresAt.toISOString(),
      userAgent: session.userAgent,
      current: session.id === currentTokenId,
    }));

    return NextResponse.json(
      {
        success: true,
        message: 'Sessions retrieved successfully',
        data: {
          sessions: formattedSessions,
          total: formattedSessions.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get sessions error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while fetching sessions',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/auth/sessions/:id - Revoke a specific session
export async function DELETE(request: NextRequest) {
  const deviceInfo = getDeviceInfo(request);

  try {
    // Get user from access token
    const decoded = await getUserFromAccessToken();

    if (!decoded) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    // Get session ID from query params
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('id');

    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Session ID is required',
        },
        { status: 400 }
      );
    }

    // Special case: revoke all sessions except current
    if (sessionId === 'all') {
      // Get current refresh token
      const currentRefreshToken = await getRefreshTokenFromCookies();
      let currentTokenId: string | null = null;

      if (currentRefreshToken) {
        const currentDecoded = verifyRefreshToken(currentRefreshToken);
        if (currentDecoded) {
          const userTokens = await prisma.refreshToken.findMany({
            where: {
              userId: decoded.userId,
              revoked: false,
            },
          });

          for (const dbToken of userTokens) {
            const isMatch = await compareToken(currentRefreshToken, dbToken.hashedToken);
            if (isMatch) {
              currentTokenId = dbToken.id;
              break;
            }
          }
        }
      }

      // Revoke all sessions except current
      const result = await prisma.refreshToken.updateMany({
        where: {
          userId: decoded.userId,
          revoked: false,
          id: currentTokenId ? { not: currentTokenId } : undefined,
        },
        data: {
          revoked: true,
          revokedAt: new Date(),
          revokedReason: 'user_revoked_all',
        },
      });

      await createAuditLog({
        userId: decoded.userId,
        action: 'session_revoked',
        details: { revokedCount: result.count, revokeAll: true },
        ip: deviceInfo.ip || undefined,
        userAgent: deviceInfo.userAgent || undefined,
        success: true,
      });

      return NextResponse.json(
        {
          success: true,
          message: `${result.count} session(s) revoked successfully`,
          data: {
            revokedCount: result.count,
          },
        },
        { status: 200 }
      );
    }

    // Revoke specific session
    const session = await prisma.refreshToken.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: 'Session not found',
        },
        { status: 404 }
      );
    }

    // Verify session belongs to user
    if (session.userId !== decoded.userId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized to revoke this session',
        },
        { status: 403 }
      );
    }

    // Revoke session
    await prisma.refreshToken.update({
      where: { id: sessionId },
      data: {
        revoked: true,
        revokedAt: new Date(),
        revokedReason: 'user_revoked',
      },
    });

    await createAuditLog({
      userId: decoded.userId,
      action: 'session_revoked',
      details: { sessionId },
      ip: deviceInfo.ip || undefined,
      userAgent: deviceInfo.userAgent || undefined,
      success: true,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Session revoked successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Revoke session error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while revoking the session',
      },
      { status: 500 }
    );
  }
}
