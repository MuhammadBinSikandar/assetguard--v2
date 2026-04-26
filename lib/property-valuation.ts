/** Canonical USD valuation: admin-verified price when set, otherwise user submission. */
export function effectivePropertyValuationUsd(
  estimatedPriceUSD: number,
  verifiedPriceUSD: number | null | undefined,
): number {
  return verifiedPriceUSD != null ? verifiedPriceUSD : estimatedPriceUSD;
}
