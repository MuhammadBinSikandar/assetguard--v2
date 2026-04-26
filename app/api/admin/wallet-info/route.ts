import { NextResponse } from 'next/server';
import { LAMPORTS_PER_SOL, Connection } from '@solana/web3.js';
import { getUserFromAccessToken } from '@/lib/auth';
import { getAdminKeypair, getSolanaRpcUrl } from '@/lib/solana/admin-keypair';
import { getSolPriceUsd } from '@/lib/solana/get-sol-price';
import { apiLogger } from '@/lib/debug-logger';

export async function GET() {
  try {
    const decoded = await getUserFromAccessToken();
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
    }
    if (!decoded.roles.includes('admin')) {
      return NextResponse.json({ success: false, message: 'Forbidden.' }, { status: 403 });
    }

    apiLogger.request('GET', '/api/admin/wallet-info');
    const adminKeypair = getAdminKeypair();
    const url = getSolanaRpcUrl();
    const network = url.includes('mainnet') ? 'mainnet' : 'devnet';
    const connection = new Connection(url, 'confirmed');
    const [balanceLamports, solPriceUsd] = await Promise.all([
      connection.getBalance(adminKeypair.publicKey, 'confirmed'),
      getSolPriceUsd(),
    ]);
    const balanceSol = balanceLamports / Number(LAMPORTS_PER_SOL);
    const balanceUsd = balanceSol * solPriceUsd;
    const pk = adminKeypair.publicKey.toBase58();

    apiLogger.response('GET', '/api/admin/wallet-info', 200, true);
    return NextResponse.json({
      success: true,
      data: {
        publicKey: pk,
        balanceLamports: String(balanceLamports),
        balanceSol,
        balanceUsd,
        solPriceUsd,
        network,
      },
    });
  } catch (e) {
    console.error('[GET /api/admin/wallet-info]', e);
    return NextResponse.json(
      { success: false, message: e instanceof Error ? e.message : 'Failed to load wallet info.' },
      { status: 500 },
    );
  }
}
