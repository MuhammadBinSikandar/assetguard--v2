/**
 * Backfill mint fields when tokens exist on-chain but the properties row missed the update.
 *
 * Usage (from project root):
 *   npx tsx scripts/backfill-property-mint.ts <propertyId> <mintAddressBase58>
 *
 * Example:
 *   npx tsx scripts/backfill-property-mint.ts d19dd383-1b90-4186-9897-d3534d89835f ECnJw7eZcSzdDnBy8PKXUNZ8WdXXPp55UkEcsz2hgnUc
 */
import prisma from '../db/prismaClient';
import { effectivePropertyValuationUsd } from '../lib/property-valuation';
import { FIXED_PROPERTY_TOKEN_SUPPLY } from '../lib/property-tokens';

async function main() {
  const [propertyId, mintAddress] = process.argv.slice(2);
  if (!propertyId || !mintAddress) {
    console.error('Usage: npx tsx scripts/backfill-property-mint.ts <propertyId> <mintAddressBase58>');
    process.exit(1);
  }

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
  });
  if (!property) {
    console.error('Property not found.');
    process.exit(1);
  }

  const v = effectivePropertyValuationUsd(property.estimatedPriceUSD, property.verifiedPriceUSD);
  const pricePerToken = v / FIXED_PROPERTY_TOKEN_SUPPLY;

  await prisma.property.update({
    where: { id: propertyId },
    data: {
      mintAddress,
      tokenSupply: FIXED_PROPERTY_TOKEN_SUPPLY,
      pricePerToken,
      mintedAt: property.mintedAt ?? new Date(),
    },
  });

  console.log('Updated property', propertyId, { mintAddress, tokenSupply: FIXED_PROPERTY_TOKEN_SUPPLY, pricePerToken });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
