import { Connection, PublicKey } from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  getMint,
} from '@solana/spl-token';
import { getToken2022AccountOrNull } from './token-2022-helpers';

/**
 * For a given purchase size, determine whether the admin can source tokens from:
 * - seller ATA with delegate = admin, or
 * - admin’s ATA (escrow) balance.
 */
export async function resolveCustodyForTransfer(
  connection: Connection,
  params: {
    mint: PublicKey;
    seller: PublicKey;
    admin: PublicKey;
    /** Whole tokens (e.g. listing tokensRemaining, or tBuy in the buy flow). */
    wholeTokens: number;
  },
): Promise<
  | { ok: true; sourceAta: PublicKey; path: 'delegate' | 'admin_ata' }
  | { ok: false; sourceAta: null; path: 'none' }
> {
  const { mint, seller, admin, wholeTokens } = params;
  if (!Number.isInteger(wholeTokens) || wholeTokens < 1) {
    return { ok: false, sourceAta: null, path: 'none' };
  }

  const mintInfo = await getMint(connection, mint, 'confirmed', TOKEN_2022_PROGRAM_ID);
  const { decimals } = mintInfo;
  const requiredRaw = BigInt(wholeTokens) * BigInt(10 ** decimals);

  const sellerAta = getAssociatedTokenAddressSync(mint, seller, false, TOKEN_2022_PROGRAM_ID);
  const adminAta = getAssociatedTokenAddressSync(mint, admin, false, TOKEN_2022_PROGRAM_ID);

  const sAcc = await getToken2022AccountOrNull(connection, sellerAta);
  const sellerHasDelegateToAdmin =
    sAcc != null &&
    sAcc.delegate != null &&
    sAcc.delegate.equals(admin) &&
    sAcc.delegatedAmount >= requiredRaw;

  if (sellerHasDelegateToAdmin) {
    return { ok: true, sourceAta: sellerAta, path: 'delegate' };
  }

  const aAcc = await getToken2022AccountOrNull(connection, adminAta);
  if (aAcc != null && aAcc.amount >= requiredRaw) {
    return { ok: true, sourceAta: adminAta, path: 'admin_ata' };
  }

  return { ok: false, sourceAta: null, path: 'none' };
}
