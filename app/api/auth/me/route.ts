import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/db/prismaClient';
import { getUserFromAccessToken } from '@/lib/auth';

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
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found',
        },
        { status: 404 }
      );
    }

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

    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while fetching user profile',
      },
      { status: 500 }
    );
  }
}
