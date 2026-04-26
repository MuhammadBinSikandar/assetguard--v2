import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/db/prismaClient';
import { apiLogger } from '@/lib/debug-logger';
import { PurchaseStatus } from '@prisma/client';
import { resolvePropertyTokenSupply } from '@/lib/property-tokens';
import {
  solanaAtaExplorerUrl,
  solanaAddressExplorerUrl,
  solanaClusterFromNetwork,
} from '@/lib/solana/explorer-links';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Row = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Row) {
  try {
    const { id: propertyId } = await ctx.params;
    if (!propertyId || !UUID_RE.test(propertyId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid property id.' },
        { status: 400 },
      );
    }
    apiLogger.request('GET', `/api/properties/${propertyId}/ownership`);

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        ownerId: true,
        tokenSupply: true,
        referenceId: true,
        mintAddress: true,
        submittedAt: true,
        blockchainNetwork: true,
        owner: { select: { id: true, name: true, email: true, walletAddress: true } },
      },
    });
    if (!property) {
      return NextResponse.json(
        { success: false, message: 'Property not found.' },
        { status: 404 },
      );
    }

    const supply = resolvePropertyTokenSupply(property.tokenSupply);
    const cluster = solanaClusterFromNetwork(property.blockchainNetwork);
    const mint = property.mintAddress;

    const [owners, purchases, listing] = await Promise.all([
      prisma.propertyOwnership.findMany({
        where: { propertyId, tokensOwned: { gt: 0 } },
        orderBy: { updatedAt: 'desc' },
        include: { user: { select: { id: true, name: true, email: true, walletAddress: true } } },
      }),
      prisma.tokenPurchase.findMany({
        where: { propertyId, status: PurchaseStatus.COMPLETED },
        orderBy: { createdAt: 'desc' },
        include: { buyer: { select: { name: true } }, seller: { select: { name: true } } },
      }),
      prisma.propertyListing.findFirst({
        where: { propertyId, sellerId: property.ownerId },
        select: { tokensRemaining: true, sellerId: true },
      }),
    ]);

    const displayName = (name: string | null, email: string | null) => name || email || '—';

    const explorerForWallet = (wallet: string | null) => {
      if (!wallet) return { wallet: null as string | null, tokenAccount: null as string | null };
      const w = solanaAddressExplorerUrl(wallet, cluster);
      const ata = mint ? solanaAtaExplorerUrl(mint, wallet, cluster) : null;
      return { wallet: w, tokenAccount: ata };
    };

    /**
     * Marketplace sellers keep unsold supply as `PropertyListing.tokensRemaining` (not in
     * `PropertyOwnership`). Buyers only get `PropertyOwnership`. Include listing remainder
     * in the display total for the listing seller.
     */
    const listingShareFor = (userId: string) =>
      listing && listing.sellerId === userId ? listing.tokensRemaining : 0;

    const ownersOut = owners.map((o) => {
      const w = o.user.walletAddress;
      const { wallet: walletExplorerUrl, tokenAccount: tokenAccountExplorerUrl } = explorerForWallet(w);
      const fromListing = listingShareFor(o.user.id);
      const totalTokens = o.tokensOwned + fromListing;
      return {
        id: o.id,
        userId: o.user.id,
        name: displayName(o.user.name, o.user.email),
        walletAddress: w,
        walletExplorerUrl,
        tokenAccountExplorerUrl,
        tokensFromPurchases: o.tokensOwned,
        tokensInListing: fromListing,
        tokensOwned: totalTokens,
        ownershipPercent: supply > 0 ? (totalTokens / supply) * 100 : 0,
        acquiredAt: o.acquiredAt.toISOString(),
        isRegistrant: o.user.id === property.ownerId,
      };
    });

    const uids = new Set(ownersOut.map((r) => r.userId));
    if (!uids.has(property.ownerId) && property.owner) {
      const w = property.owner.walletAddress;
      const { wallet: walletExplorerUrl, tokenAccount: tokenAccountExplorerUrl } = explorerForWallet(w);
      const tr = listingShareFor(property.ownerId);
      ownersOut.unshift({
        id: `registrant-${property.ownerId}`,
        userId: property.owner.id,
        name: displayName(property.owner.name, property.owner.email),
        walletAddress: w,
        walletExplorerUrl,
        tokenAccountExplorerUrl,
        tokensFromPurchases: 0,
        tokensInListing: tr,
        tokensOwned: tr,
        ownershipPercent: supply > 0 ? (tr / supply) * 100 : 0,
        acquiredAt: property.submittedAt.toISOString(),
        isRegistrant: true,
      });
    }

    ownersOut.sort((a, b) => {
      if (a.isRegistrant !== b.isRegistrant) return a.isRegistrant ? -1 : 1;
      return b.tokensOwned - a.tokensOwned;
    });

    const purchasesOut = purchases.map((p) => ({
      id: p.id,
      createdAt: p.createdAt.toISOString(),
      buyerWallet: p.buyerWallet,
      sellerWallet: p.sellerWallet,
      tokensBought: p.tokensBought,
      totalSolPaid: p.totalSolPaid,
      platformFeeSol: p.platformFeeSol,
      status: p.status,
      solTransferTxHash: p.solTransferTxHash,
      tokenTransferTxHash: p.tokenTransferTxHash,
      solReleaseTxHash: p.solReleaseTxHash,
    }));

    const body = {
      referenceId: property.referenceId,
      tokenSupply: supply,
      mintAddress: mint,
      solanaCluster: cluster,
      owners: ownersOut,
      purchases: purchasesOut,
    };
    apiLogger.response('GET', `/api/properties/${propertyId}/ownership`, 200, true);
    return NextResponse.json({ success: true, data: body }, { status: 200 });
  } catch (e) {
    console.error('[GET /api/properties/[id]/ownership]', e);
    return NextResponse.json(
      { success: false, message: 'Failed to load ownership data.' },
      { status: 500 },
    );
  }
}
