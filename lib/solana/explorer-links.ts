import { PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddressSync, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';

/** Map stored `Property.blockchainNetwork` to Solana Explorer `cluster` query value. */
export function solanaClusterFromNetwork(blockchainNetwork: string | null | undefined): string {
  const n = (blockchainNetwork ?? '').toLowerCase();
  if (n.includes('mainnet') && !n.includes('dev') && !n.includes('test')) return 'mainnet-beta';
  if (n.includes('testnet')) return 'testnet';
  return 'devnet';
}

export function solanaAddressExplorerUrl(address: string, cluster: string): string {
  return `https://explorer.solana.com/address/${encodeURIComponent(address)}?cluster=${encodeURIComponent(
    cluster,
  )}`;
}

/** User's associated token account for this Token-2022 mint (for verifying balance on Explorer). */
export function solanaAtaExplorerUrl(
  mintAddress: string,
  ownerWalletAddress: string,
  cluster: string,
): string | null {
  try {
    const mint = new PublicKey(mintAddress);
    const owner = new PublicKey(ownerWalletAddress);
    const ata = getAssociatedTokenAddressSync(mint, owner, false, TOKEN_2022_PROGRAM_ID);
    return solanaAddressExplorerUrl(ata.toBase58(), cluster);
  } catch {
    return null;
  }
}
