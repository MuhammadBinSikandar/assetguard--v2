-- Allow multiple listings per property (one active offer per seller).
DROP INDEX IF EXISTS "property_listings_propertyId_key";

CREATE UNIQUE INDEX "property_listings_propertyId_sellerId_key" ON "property_listings"("propertyId", "sellerId");

CREATE INDEX IF NOT EXISTS "property_listings_propertyId_idx" ON "property_listings"("propertyId");
