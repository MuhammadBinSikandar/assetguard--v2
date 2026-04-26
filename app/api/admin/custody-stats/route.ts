import { NextResponse } from 'next/server';
import { PurchaseStatus } from '@prisma/client';
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

    const [totalPending, totalEscrowReceived, totalCompleted, totalFailed, escrowSum, platformFees, volumeSol] =
      await Promise.all([
        prisma.tokenPurchase.count({ where: { status: PurchaseStatus.PENDING } }),
        prisma.tokenPurchase.count({ where: { status: PurchaseStatus.ESCROW_RECEIVED } }),
        prisma.tokenPurchase.count({ where: { status: PurchaseStatus.COMPLETED } }),
        prisma.tokenPurchase.count({ where: { status: PurchaseStatus.FAILED } }),
        prisma.tokenPurchase.aggregate({
          where: { status: PurchaseStatus.ESCROW_RECEIVED },
          _sum: { totalSolPaid: true },
        }),
        prisma.tokenPurchase.aggregate({
          where: { status: PurchaseStatus.COMPLETED },
          _sum: { platformFeeSol: true },
        }),
        prisma.tokenPurchase.aggregate({
          where: { status: PurchaseStatus.COMPLETED },
          _sum: { totalSolPaid: true },
        }),
      ]);

    return NextResponse.json({
      success: true,
      data: {
        totalPending,
        totalEscrowReceived,
        totalCompleted,
        totalFailed,
        totalSolHeld: escrowSum._sum.totalSolPaid ?? 0,
        totalPlatformFeesCollected: platformFees._sum.platformFeeSol ?? 0,
        totalVolumeSol: volumeSol._sum.totalSolPaid ?? 0,
      },
    });
  } catch (e) {
    console.error('[GET /api/admin/custody-stats]', e);
    return NextResponse.json({ success: false, message: 'Internal error.' }, { status: 500 });
  }
}
