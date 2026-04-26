import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/db/prismaClient';
import { getUserFromAccessToken } from '@/lib/auth';
import { apiLogger } from '@/lib/debug-logger';

export async function GET(_req: NextRequest) {
  try {
    apiLogger.request('GET', '/api/transactions/my-transactions');
    const decoded = await getUserFromAccessToken();
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Please log in.' },
        { status: 401 },
      );
    }

    const uid = decoded.userId;
    const rows = await prisma.tokenPurchase.findMany({
      where: { OR: [{ buyerId: uid }, { sellerId: uid }] },
      orderBy: { createdAt: 'desc' },
      include: {
        property: { select: { referenceId: true } },
        buyer: { select: { email: true } },
        seller: { select: { email: true } },
      },
    });

    const data = rows.map((p) => {
      const asBuyer = p.buyerId === uid;
      return {
        id: p.id,
        type: asBuyer ? ('Bought' as const) : ('Sold' as const),
        createdAt: p.createdAt.toISOString(),
        propertyReferenceId: p.property.referenceId,
        tokens: p.tokensBought,
        totalSolPaid: p.totalSolPaid,
        sellerReceivedSol: p.sellerReceivedSol,
        platformFeeSol: p.platformFeeSol,
        /** Email of the other party in this trade. */
        counterpartyEmail: asBuyer ? p.seller.email : p.buyer.email,
        status: p.status,
        solTransferTxHash: p.solTransferTxHash,
        tokenTransferTxHash: p.tokenTransferTxHash,
        solReleaseTxHash: p.solReleaseTxHash,
        refundTxHash: p.refundTxHash,
      };
    });

    apiLogger.response('GET', '/api/transactions/my-transactions', 200, true);
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (e) {
    console.error('[GET /api/transactions/my-transactions]', e);
    return NextResponse.json(
      { success: false, message: 'Failed to load transactions.' },
      { status: 500 },
    );
  }
}
