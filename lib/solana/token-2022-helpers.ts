import { Connection, PublicKey } from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID,
  getAccount,
  TokenAccountNotFoundError,
} from '@solana/spl-token';
import type { Account } from '@solana/spl-token';

/** `getAccount` throws if the ATA was never created; this returns null instead. */
export async function getToken2022AccountOrNull(
  connection: Connection,
  address: PublicKey,
): Promise<Account | null> {
  try {
    return await getAccount(connection, address, 'confirmed', TOKEN_2022_PROGRAM_ID);
  } catch (e) {
    if (e instanceof TokenAccountNotFoundError) {
      return null;
    }
    throw e;
  }
}
