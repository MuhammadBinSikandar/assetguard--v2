import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/db/prismaClient';
import {
  getRefreshTokenFromCookies,
  verifyRefreshToken,
  clearAuthCookies,
  getDeviceInfo,
} from '@/lib/auth';
import { compareToken } from '@/lib/bcrypt';
import { createAuditLog } from '@/lib/logger';
import { clearCSRFToken } from '@/lib/csrf';

export async function POST(request: NextRequest) {
  const deviceInfo = getDeviceInfo(request);

  try {
    // Get refresh token from cookie
    const refreshToken = await getRefreshTokenFromCookies();

    if (refreshToken) {
      // Verify and decode token
      const decoded = verifyRefreshToken(refreshToken);

      if (decoded) {
        // Find and revoke the token in database
        const userTokens = await prisma.refreshToken.findMany({
          where: {
            userId: decoded.userId,
            revoked: false,
          },
        });

        // Find matching token
        for (const dbToken of userTokens) {
          const isMatch = await compareToken(refreshToken, dbToken.hashedToken);
          if (isMatch) {
            // Revoke this token
            await prisma.refreshToken.update({
              where: { id: dbToken.id },
              data: {
                revoked: true,
                revokedAt: new Date(),
                revokedReason: 'logout',
              },
            });

            // Audit log
            await createAuditLog({
              userId: decoded.userId,
              action: 'logout',
              details: { tokenId: dbToken.id },
              ip: deviceInfo.ip || undefined,
              userAgent: deviceInfo.userAgent || undefined,
              success: true,
            });

            break;
          }
        }
      }
    }

    // Clear cookies regardless of token validity
    await clearAuthCookies();
    await clearCSRFToken();

    return NextResponse.json(
      {
        success: true,
        message: 'Logged out successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Logout error:', error);

    // Still clear cookies even if there's an error
    await clearAuthCookies();
    await clearCSRFToken();

    return NextResponse.json(
      {
        success: true,
        message: 'Logged out successfully',
      },
      { status: 200 }
    );
  }
}
