import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

/**
 * Safely decode the Admin Secret Key from environment variables.
 * The key should be stored as a Base58-encoded string in ADMIN_SECRET_KEY.
 *
 * @throws Error if the key is missing or invalid
 */
export function getAdminKeypair(): Keypair {
  const secretKeyBase58 = process.env.ADMIN_SECRET_KEY;

  if (!secretKeyBase58) {
    throw new Error(
      'ADMIN_SECRET_KEY environment variable is not set. ' +
        'Please add your Solana admin wallet secret key (base58 format) to .env',
    );
  }

  try {
    const secretKeyBytes = bs58.decode(secretKeyBase58);

    if (secretKeyBytes.length !== 64) {
      throw new Error(
        `Invalid secret key length: expected 64 bytes, got ${secretKeyBytes.length}. ` +
          'Make sure you are using the full secret key, not just the public key.',
      );
    }

    return Keypair.fromSecretKey(secretKeyBytes);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Invalid secret key length')) {
      throw error;
    }
    throw new Error(
      'Failed to decode ADMIN_SECRET_KEY. Ensure it is a valid Base58-encoded Solana secret key.',
    );
  }
}

/**
 * Get the Solana RPC endpoint URL from environment.
 * Defaults to Devnet if not specified.
 */
export function getSolanaRpcUrl(): string {
  return process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
}
