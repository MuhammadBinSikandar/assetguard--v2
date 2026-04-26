-- CreateEnum
CREATE TYPE "ScrapeStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "property_verification_data" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "scrapedAt" TIMESTAMP(3),
    "scrapeStatus" "ScrapeStatus" NOT NULL DEFAULT 'PENDING',
    "scrapeError" TEXT,
    "address" TEXT,
    "ownerName" TEXT,
    "propertyType" TEXT,
    "taxClass" TEXT,
    "yearBuilt" TEXT,
    "numberOfStories" TEXT,
    "totalArea" TEXT,
    "residentialUnits" TEXT,
    "commercialUnits" TEXT,
    "frontage" TEXT,
    "landDepth" TEXT,
    "landArea" TEXT,
    "estimatedPrice" TEXT,

    CONSTRAINT "property_verification_data_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "property_verification_data_propertyId_key" ON "property_verification_data"("propertyId");

-- CreateIndex
CREATE INDEX "property_verification_data_propertyId_idx" ON "property_verification_data"("propertyId");

-- AddForeignKey
ALTER TABLE "property_verification_data" ADD CONSTRAINT "property_verification_data_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
