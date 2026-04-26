/** Solana Explorer URL for a transaction signature. */
export function solanaTxExplorerUrl(signature: string, cluster: 'devnet' | 'mainnet' = 'devnet'): string {
  const c = cluster === 'mainnet' ? 'mainnet' : 'devnet';
  return `https://explorer.solana.com/tx/${encodeURIComponent(signature)}?cluster=${c}`;
}
