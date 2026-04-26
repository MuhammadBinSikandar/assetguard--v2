-- Add Token-2022 minting fields to properties
ALTER TABLE "properties"
ADD COLUMN IF NOT EXISTS "mintAddress" TEXT,
ADD COLUMN IF NOT EXISTS "mintSignature" TEXT,
ADD COLUMN IF NOT EXISTS "mintedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "tokenSupply" INTEGER;

-- Keep parity with Prisma schema indexes
CREATE UNIQUE INDEX IF NOT EXISTS "properties_mintAddress_key" ON "properties"("mintAddress");
CREATE INDEX IF NOT EXISTS "properties_mintAddress_idx" ON "properties"("mintAddress");
