import { NextResponse } from 'next/server';
import { getAdminKeypair } from '@/lib/solana/admin-keypair';
import { apiLogger } from '@/lib/debug-logger';

/** Public key of the server escrow (same as admin wallet in devnet). */
export async function GET() {
  try {
    apiLogger.request('GET', '/api/escrow-wallet');
    const kp = getAdminKeypair();
    const address = kp.publicKey.toBase58();
    apiLogger.response('GET', '/api/escrow-wallet', 200, true);
    return NextResponse.json({ success: true, address }, { status: 200 });
  } catch (e) {
    console.error('[GET /api/escrow-wallet]', e);
    return NextResponse.json(
      { success: false, message: 'Escrow address is not configured on the server.' },
      { status: 500 },
    );
  }
}
