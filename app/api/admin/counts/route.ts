import { NextResponse } from 'next/server';
import prisma from '@/db/prismaClient';
import { getUserFromAccessToken } from '@/lib/auth';

export async function GET() {
  try {
    const decoded = await getUserFromAccessToken();
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
    }
    if (!decoded.roles.includes('admin')) {
      return NextResponse.json({ success: false, message: 'Forbidden.' }, { status: 403 });
    }

    const [pendingKyc, pendingProperties] = await Promise.all([
      prisma.user.count({ where: { kycStatus: 'PENDING' } }),
      prisma.property.count({ where: { status: { in: ['PENDING', 'UNDER_REVIEW'] } } }),
    ]);

    return NextResponse.json({
      success: true,
      data: { pendingKyc, pendingProperties },
    });
  } catch (error) {
    console.error('[Admin Counts] Error:', error);
    return NextResponse.json({ success: false, message: 'Internal error.' }, { status: 500 });
  }
}
