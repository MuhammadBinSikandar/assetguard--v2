-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('ACTIVE', 'SOLD');

-- CreateTable
CREATE TABLE "property_listings" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "tokensListed" INTEGER NOT NULL,
    "pricePerToken" DOUBLE PRECISION NOT NULL,
    "totalValue" DOUBLE PRECISION NOT NULL,
    "status" "ListingStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_bookmarks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "property_listings_propertyId_key" ON "property_listings"("propertyId");

-- CreateIndex
CREATE INDEX "property_listings_sellerId_idx" ON "property_listings"("sellerId");

-- CreateIndex
CREATE INDEX "property_listings_status_idx" ON "property_listings"("status");

-- CreateIndex
CREATE UNIQUE INDEX "listing_bookmarks_userId_listingId_key" ON "listing_bookmarks"("userId", "listingId");

-- CreateIndex
CREATE INDEX "listing_bookmarks_listingId_idx" ON "listing_bookmarks"("listingId");

-- AddForeignKey
ALTER TABLE "property_listings" ADD CONSTRAINT "property_listings_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_listings" ADD CONSTRAINT "property_listings_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_bookmarks" ADD CONSTRAINT "listing_bookmarks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_bookmarks" ADD CONSTRAINT "listing_bookmarks_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "property_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
