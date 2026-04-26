import { NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { getMint, getAssociatedTokenAddressSync, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { ListingStatus } from '@prisma/client';
import prisma from '@/db/prismaClient';
import { getUserFromAccessToken } from '@/lib/auth';
import { getSolanaRpcUrl } from '@/lib/solana/admin-keypair';
import { getToken2022AccountOrNull } from '@/lib/solana/token-2022-helpers';

export async function GET() {
  try {
    const decoded = await getUserFromAccessToken();
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
    }
    if (!decoded.roles.includes('admin')) {
      return NextResponse.json({ success: false, message: 'Forbidden.' }, { status: 403 });
    }

    const listings = await prisma.propertyListing.findMany({
      where: { status: ListingStatus.ACTIVE, tokensRemaining: { gt: 0 } },
      include: {
        property: { select: { id: true, referenceId: true, mintAddress: true } },
        seller: { select: { name: true, email: true, walletAddress: true } },
      },
    });

    const url = getSolanaRpcUrl();
    const connection = new Connection(url, 'confirmed');
    const issues: Array<{
      listingId: string;
      propertyReferenceId: string;
      sellerName: string | null;
      sellerEmail: string | null;
      sellerWallet: string;
      tokensRemaining: number;
      tokensInCustodyWhole: number;
      gap: number;
    }> = [];

    for (const l of listings) {
      if (!l.property.mintAddress || !l.seller.walletAddress) continue;
      try {
        const mint = new PublicKey(l.property.mintAddress);
        const seller = new PublicKey(l.seller.walletAddress);
        const ata = getAssociatedTokenAddressSync(mint, seller, false, TOKEN_2022_PROGRAM_ID);
        const mintInfo = await getMint(connection, mint, 'confirmed', TOKEN_2022_PROGRAM_ID);
        const dec = mintInfo.decimals;
        const acc = await getToken2022AccountOrNull(connection, ata);
        const raw = acc != null ? acc.amount : 0n;
        const whole = Number(raw / BigInt(10 ** dec));
        if (whole < l.tokensRemaining) {
          issues.push({
            listingId: l.id,
            propertyReferenceId: l.property.referenceId,
            sellerName: l.seller.name,
            sellerEmail: l.seller.email,
            sellerWallet: l.seller.walletAddress,
            tokensRemaining: l.tokensRemaining,
            tokensInCustodyWhole: whole,
            gap: l.tokensRemaining - whole,
          });
        }
      } catch (err) {
        console.error('[readiness-issues] listing', l.id, err);
      }
    }

    return NextResponse.json({ success: true, data: { issues } });
  } catch (e) {
    console.error('[GET /api/admin/readiness-issues]', e);
    return NextResponse.json({ success: false, message: 'Internal error.' }, { status: 500 });
  }
}
