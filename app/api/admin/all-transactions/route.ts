import { NextRequest, NextResponse } from 'next/server';
import { PurchaseStatus } from '@prisma/client';
import prisma from '@/db/prismaClient';
import { getUserFromAccessToken } from '@/lib/auth';

const purchaseInclude = {
  property: { select: { referenceId: true, borough: true, block: true, lot: true } },
  buyer: { select: { name: true, email: true, walletAddress: true } },
  seller: { select: { name: true, email: true, walletAddress: true } },
} as const;

const ALL_STATUSES: PurchaseStatus[] = [
  PurchaseStatus.PENDING,
  PurchaseStatus.ESCROW_RECEIVED,
  PurchaseStatus.COMPLETED,
  PurchaseStatus.FAILED,
];

export async function GET(request: NextRequest) {
  try {
    const decoded = await getUserFromAccessToken();
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
    }
    if (!decoded.roles.includes('admin')) {
      return NextResponse.json({ success: false, message: 'Forbidden.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const pageSize = 20;
    const statusParam = searchParams.get('status');
    const status: PurchaseStatus | 'ALL' | null =
      statusParam && statusParam !== 'ALL' && (ALL_STATUSES as string[]).includes(statusParam)
        ? (statusParam as PurchaseStatus)
        : null;

    const where =
      status && statusParam !== 'ALL' ? { status: status as PurchaseStatus } : {};

    const [total, rows] = await Promise.all([
      prisma.tokenPurchase.count({ where }),
      prisma.tokenPurchase.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: purchaseInclude,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: rows,
      meta: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
    });
  } catch (e) {
    console.error('[GET /api/admin/all-transactions]', e);
    return NextResponse.json({ success: false, message: 'Internal error.' }, { status: 500 });
  }
}
