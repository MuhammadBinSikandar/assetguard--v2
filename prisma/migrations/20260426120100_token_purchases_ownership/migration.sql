-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('PENDING', 'ESCROW_RECEIVED', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "property_listings" ADD COLUMN "tokensRemaining" INTEGER NOT NULL DEFAULT 0;

-- Backfill remaining tokens for existing rows (listed before this column)
UPDATE "property_listings" SET "tokensRemaining" = "tokensListed";

-- CreateTable
CREATE TABLE "token_purchases" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "tokensBought" INTEGER NOT NULL,
    "pricePerToken" DOUBLE PRECISION NOT NULL,
    "totalSolPaid" DOUBLE PRECISION NOT NULL,
    "platformFeeSol" DOUBLE PRECISION NOT NULL,
    "sellerReceivedSol" DOUBLE PRECISION NOT NULL,
    "solPriceUsdAtPurchase" DOUBLE PRECISION NOT NULL,
    "buyerWallet" TEXT NOT NULL,
    "sellerWallet" TEXT NOT NULL,
    "solTransferTxHash" TEXT,
    "tokenTransferTxHash" TEXT,
    "solReleaseTxHash" TEXT,
    "status" "PurchaseStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "token_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_ownerships" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokensOwned" INTEGER NOT NULL,
    "acquiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_ownerships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "token_purchases_solTransferTxHash_key" ON "token_purchases"("solTransferTxHash");

-- CreateIndex
CREATE INDEX "token_purchases_propertyId_idx" ON "token_purchases"("propertyId");

-- CreateIndex
CREATE INDEX "token_purchases_buyerId_idx" ON "token_purchases"("buyerId");

-- CreateIndex
CREATE INDEX "token_purchases_sellerId_idx" ON "token_purchases"("sellerId");

-- CreateIndex
CREATE INDEX "token_purchases_listingId_idx" ON "token_purchases"("listingId");

-- CreateIndex
CREATE INDEX "token_purchases_status_idx" ON "token_purchases"("status");

-- CreateIndex
CREATE UNIQUE INDEX "property_ownerships_propertyId_userId_key" ON "property_ownerships"("propertyId", "userId");

-- CreateIndex
CREATE INDEX "property_ownerships_userId_idx" ON "property_ownerships"("userId");

-- CreateIndex
CREATE INDEX "property_ownerships_propertyId_idx" ON "property_ownerships"("propertyId");

-- AddForeignKey
ALTER TABLE "token_purchases" ADD CONSTRAINT "token_purchases_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "property_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "token_purchases" ADD CONSTRAINT "token_purchases_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "token_purchases" ADD CONSTRAINT "token_purchases_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "token_purchases" ADD CONSTRAINT "token_purchases_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_ownerships" ADD CONSTRAINT "property_ownerships_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_ownerships" ADD CONSTRAINT "property_ownerships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
