import prisma from '@/db/prismaClient';
import { scrapeProperty } from './scrape-property';

/**
 * Run scrapeProperty in the background and update the PropertyVerificationData record.
 * This function is fire-and-forget — call it without `await`.
 */
export function triggerBackgroundScrape(
  propertyId: string,
  borough: string,
  block: string,
  lot: string,
): void {
  // Fire-and-forget — runs in the background
  (async () => {
    try {
      console.log(`[ScrapeWorker] Starting scrape for property ${propertyId}...`);

      const result = await scrapeProperty(borough, block, lot);

      if (result) {
        await prisma.propertyVerificationData.update({
          where: { propertyId },
          data: {
            scrapeStatus: 'SUCCESS',
            scrapedAt: new Date(),
            scrapeError: null,
            address: result.address,
            ownerName: result.ownerName,
            propertyType: result.propertyType,
            taxClass: result.taxClass,
            yearBuilt: result.yearBuilt,
            numberOfStories: result.numberOfStories,
            totalArea: result.totalArea,
            residentialUnits: result.residentialUnits,
            commercialUnits: result.commercialUnits,
            frontage: result.frontage,
            landDepth: result.landDepth,
            landArea: result.landArea,
            estimatedPrice: result.estimatedPrice,
          },
        });
        console.log(`[ScrapeWorker] Successfully scraped property ${propertyId}.`);
      } else {
        await prisma.propertyVerificationData.update({
          where: { propertyId },
          data: {
            scrapeStatus: 'FAILED',
            scrapedAt: new Date(),
            scrapeError: 'Scraper returned no data. The page may not have loaded correctly.',
          },
        });
        console.error(`[ScrapeWorker] Scrape returned null for property ${propertyId}.`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred during scraping.';
      console.error(`[ScrapeWorker] Error scraping property ${propertyId}:`, error);

      try {
        await prisma.propertyVerificationData.update({
          where: { propertyId },
          data: {
            scrapeStatus: 'FAILED',
            scrapedAt: new Date(),
            scrapeError: errorMessage,
          },
        });
      } catch (dbError) {
        console.error(`[ScrapeWorker] Failed to update verification record:`, dbError);
      }
    }
  })();
}
