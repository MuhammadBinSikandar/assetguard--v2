import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/db/prismaClient';
import { getUserFromAccessToken } from '@/lib/auth';
import { apiLogger } from '@/lib/debug-logger';

export async function GET(request: NextRequest) {
  try {
    apiLogger.request('GET', '/api/auth/me');
    
    // Get user from access token
    const decoded = await getUserFromAccessToken();

    if (!decoded) {
      apiLogger.response('GET', '/api/auth/me', 401, false);
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    // Fetch fresh user data from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        roles: true,
        emailVerified: true,
        twoFactorEnabled: true,
        kycStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      apiLogger.response('GET', '/api/auth/me', 404, false);
      return NextResponse.json(
        {
          success: false,
          message: 'User not found',
        },
        { status: 404 }
      );
    }

    apiLogger.response('GET', '/api/auth/me', 200, true);
    apiLogger.request('GET', '/api/auth/me', decoded.userId);
    
    return NextResponse.json(
      {
        success: true,
        message: 'User profile retrieved successfully',
        data: {
          user,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get user profile error:', error);
    apiLogger.error('GET', '/api/auth/me', error instanceof Error ? error.message : 'Unknown error');

    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while fetching user profile',
      },
      { status: 500 }
    );
  }
}
