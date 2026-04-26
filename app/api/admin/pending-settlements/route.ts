import { NextResponse } from 'next/server';
import { PurchaseStatus } from '@prisma/client';
import prisma from '@/db/prismaClient';
import { getUserFromAccessToken } from '@/lib/auth';

const purchaseInclude = {
  property: { select: { referenceId: true, borough: true, block: true, lot: true } },
  buyer: { select: { name: true, email: true, walletAddress: true } },
  seller: { select: { name: true, email: true, walletAddress: true } },
} as const;

export async function GET() {
  try {
    const decoded = await getUserFromAccessToken();
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
    }
    if (!decoded.roles.includes('admin')) {
      return NextResponse.json({ success: false, message: 'Forbidden.' }, { status: 403 });
    }

    const rows = await prisma.tokenPurchase.findMany({
      where: {
        OR: [
          { status: PurchaseStatus.PENDING },
          { status: PurchaseStatus.ESCROW_RECEIVED },
          { status: PurchaseStatus.FAILED, refundTxHash: null },
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: purchaseInclude,
    });

    return NextResponse.json({ success: true, data: rows });
  } catch (e) {
    console.error('[GET /api/admin/pending-settlements]', e);
    return NextResponse.json({ success: false, message: 'Internal error.' }, { status: 500 });
  }
}
