import { effectivePropertyValuationUsd } from '@/lib/property-valuation';

/** Matches Token-2022 minting: every property is split into 1,000 shares. */
export const FIXED_PROPERTY_TOKEN_SUPPLY = 1000;

/**
 * Resolves on-chain total supply for listing and display.
 * If the row was never backfilled after mint, we still use the fixed offering size.
 */
export function resolvePropertyTokenSupply(tokenSupply: number | null | undefined): number {
  if (tokenSupply != null) return tokenSupply;
  return FIXED_PROPERTY_TOKEN_SUPPLY;
}

/**
 * USD per token: prefer DB (set at mint); otherwise valuation / fixed supply.
 */
export function resolvePropertyPricePerToken(
  estimatedPriceUSD: number,
  verifiedPriceUSD: number | null,
  pricePerToken: number | null | undefined,
): number {
  if (pricePerToken != null) return pricePerToken;
  const v = effectivePropertyValuationUsd(estimatedPriceUSD, verifiedPriceUSD);
  return v / FIXED_PROPERTY_TOKEN_SUPPLY;
}
