import { Keypair, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';

const BASE58_TOKEN_REGEX = /[1-9A-HJ-NP-Za-km-z]{40,}/g;
const CANDIDATE_KEY_LENGTHS = [
  83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96,
];

function tryDecode64ByteBase58(candidate: string): Uint8Array | null {
  try {
    const decoded = bs58.decode(candidate);
    return decoded.length === 64 ? decoded : null;
  } catch {
    return null;
  }
}

function tryParseJsonSecretArray(value: string): Uint8Array | null {
  if (!value.startsWith('[') || !value.endsWith(']')) return null;

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed) || parsed.length !== 64) return null;
    if (!parsed.every((n) => Number.isInteger(n) && n >= 0 && n <= 255)) return null;
    return Uint8Array.from(parsed);
  } catch {
    return null;
  }
}

function extractSecretKeyBytes(rawSecret: string): Uint8Array {
  const normalized = rawSecret.trim().replace(/^['"]|['"]$/g, '');

  const jsonKeyBytes = tryParseJsonSecretArray(normalized);
  if (jsonKeyBytes) return jsonKeyBytes;

  const directBytes = tryDecode64ByteBase58(normalized);
  if (directBytes) return directBytes;

  const candidates = new Set<string>();

  const placeholder = 'your_base58_secret_key_here';
  const placeholderIndex = normalized.indexOf(placeholder);
  if (placeholderIndex >= 0) {
    const suffix = normalized.slice(placeholderIndex + placeholder.length).trim();
    if (suffix) candidates.add(suffix);
  }

  for (const token of normalized.match(BASE58_TOKEN_REGEX) ?? []) {
    candidates.add(token);
  }

  for (const candidate of candidates) {
    const decoded = tryDecode64ByteBase58(candidate);
    if (decoded) return decoded;
  }

  // Fallback: scan likely key-length windows in noisy strings.
  for (const candidate of candidates) {
    for (const keyLength of CANDIDATE_KEY_LENGTHS) {
      if (candidate.length < keyLength) continue;

      for (let start = 0; start <= candidate.length - keyLength; start += 1) {
        const window = candidate.slice(start, start + keyLength);
        const decoded = tryDecode64ByteBase58(window);
        if (decoded) return decoded;
      }
    }
  }

  throw new Error(
    'Failed to decode ADMIN_SECRET_KEY. Use a valid Base58-encoded 64-byte secret key (or a JSON array of 64 bytes) and remove placeholder text like "your_base58_secret_key_here".',
  );
}

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

  const secretKeyBytes = extractSecretKeyBytes(secretKeyBase58);
  const keypair = Keypair.fromSecretKey(secretKeyBytes);

  const expectedEscrow = process.env.ESCROW_WALLET?.trim() || process.env.ADMIN_WALLET?.trim();
  if (expectedEscrow) {
    let want: PublicKey;
    try {
      want = new PublicKey(expectedEscrow);
    } catch {
      throw new Error('ESCROW_WALLET / ADMIN_WALLET is not a valid Solana public key.');
    }
    if (!keypair.publicKey.equals(want)) {
      throw new Error(
        `Admin keypair address ${keypair.publicKey.toBase58()} does not match ESCROW_WALLET / ADMIN_WALLET ` +
          `(${expectedEscrow}). Set ADMIN_SECRET_KEY to the private key of your escrow wallet, or align ESCROW_WALLET with that keypair.`,
      );
    }
  }

  return keypair;
}

/**
 * Get the Solana RPC endpoint URL from environment.
 * Defaults to Devnet if not specified.
 */
export function getSolanaRpcUrl(): string {
  return process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
}
