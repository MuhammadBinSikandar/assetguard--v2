import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/db/prismaClient';
import {
  verifyRefreshToken,
  getDeviceInfo,
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
} from '@/lib/auth';
import { compareToken } from '@/lib/bcrypt';
import { createAuditLog } from '@/lib/logger';

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
    // Get refresh token from cookie
    const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;

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

    // Create response and clear cookies
    const response = NextResponse.json(
      {
        success: true,
        message: 'Logged out successfully',
      },
      { status: 200 }
    );
    
    return clearCookiesOnResponse(response);
  } catch (error) {
    console.error('Logout error:', error);

    // Still clear cookies even if there's an error
    const errorResponse = NextResponse.json(
      {
        success: true,
        message: 'Logged out successfully',
      },
      { status: 200 }
    );
    
    return clearCookiesOnResponse(errorResponse);
  }
}
