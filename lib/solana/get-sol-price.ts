/**
 * Live SOL/USD from CoinGecko. Cached 60s when used in Next.js fetch context.
 */
export async function getSolPriceUsd(): Promise<number> {
  const res = await fetch(
    'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd',
    { next: { revalidate: 60 } },
  );
  if (!res.ok) {
    throw new Error(`CoinGecko SOL price request failed: ${res.status}`);
  }
  const data = (await res.json()) as { solana?: { usd?: number } };
  const p = data.solana?.usd;
  if (typeof p !== 'number' || !Number.isFinite(p) || p <= 0) {
    throw new Error('Invalid SOL price from CoinGecko');
  }
  return p;
}
