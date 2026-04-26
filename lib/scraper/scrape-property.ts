import { chromium, type Page } from 'playwright';

// ── Borough code mapping ─────────────────────────────────────────────────────

const BOROUGH_CODES: Record<string, string> = {
  manhattan: '10',
  bronx: '20',
  brooklyn: '30',
  queens: '40',
  'staten island': '50',
};

// ── Scraped data shape ───────────────────────────────────────────────────────

export interface ScrapedPropertyData {
  address: string | null;
  ownerName: string | null;
  propertyType: string | null;
  taxClass: string | null;
  yearBuilt: string | null;
  numberOfStories: string | null;
  totalArea: string | null;
  residentialUnits: string | null;
  commercialUnits: string | null;
  frontage: string | null;
  landDepth: string | null;
  landArea: string | null;
  estimatedPrice: string | null;
}

// ── XPath selectors (same as Python script) ──────────────────────────────────

const FIELD_XPATHS = {
  address:
    '//*[@id="root"]/div/div[1]/div[2]/div[1]/div/div[2]/div[2]/div[3]/p',
  ownerName:
    '//*[@id="root"]/div/div[1]/div[2]/div[1]/div/div[2]/div[3]/div[1]/div[2]/div[2]/div/p',
  propertyType:
    '//*[@id="root"]/div/div[1]/div[2]/div[1]/div/div[2]/div[3]/div[1]/div[3]/div[2]/div/p',
  taxClass:
    '//*[@id="root"]/div/div[1]/div[2]/div[1]/div/div[2]/div[3]/div[1]/div[3]/div[4]/div/p',
  yearBuilt:
    '//*[@id="root"]/div/div[1]/div[2]/div[1]/div/div[2]/div[3]/div[2]/div[2]/div[2]/p[1]',
  numberOfStories:
    '//*[@id="root"]/div/div[1]/div[2]/div[1]/div/div[2]/div[3]/div[2]/div[2]/div[3]/p[1]',
  totalArea:
    '//*[@id="root"]/div/div[1]/div[2]/div[1]/div/div[2]/div[3]/div[2]/div[2]/div[4]/p[1]',
  residentialUnits:
    '//*[@id="root"]/div/div[1]/div[2]/div[1]/div/div[2]/div[3]/div[2]/div[3]/div[2]/p[1]',
  commercialUnits:
    '//*[@id="root"]/div/div[1]/div[2]/div[1]/div/div[2]/div[3]/div[2]/div[3]/div[4]/p[1]',
  frontage:
    '//*[@id="root"]/div/div[1]/div[2]/div[1]/div/div[2]/div[3]/div[3]/div[2]/div[1]/p[1]',
  landDepth:
    '//*[@id="root"]/div/div[1]/div[2]/div[1]/div/div[2]/div[3]/div[3]/div[2]/div[2]/p[1]',
  landArea:
    '//*[@id="root"]/div/div[1]/div[2]/div[1]/div/div[2]/div[3]/div[3]/div[2]/div[3]/p[1]',
  estimatedPrice:
    '//*[@id="root"]/div/div[1]/div[2]/div[1]/div/div[2]/div[3]/div[4]/div[2]/div[1]/p[1]',
} as const;

// ── Constants ────────────────────────────────────────────────────────────────

const INITIAL_PAGE_WAIT_MS = 25_000;
const FIELD_WAIT_TIMEOUT_MS = 120_000;

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildParcelUrl(borough: string, block: string, lot: string): string {
  const key = borough.trim().toLowerCase();
  const code = BOROUGH_CODES[key];
  if (!code) {
    throw new Error(
      `Invalid borough "${borough}". Must be one of: ${Object.keys(BOROUGH_CODES).join(', ')}`,
    );
  }
  if (!block.trim().match(/^\d+$/)) {
    throw new Error(`Block must be a number, got "${block}"`);
  }
  if (!lot.trim().match(/^\d+$/)) {
    throw new Error(`Lot must be a number, got "${lot}"`);
  }

  const blockPadded = block.trim().padStart(4, '0');
  const lotPadded = lot.trim().padStart(4, '0');
  const parcelId = `${code}${blockPadded}${lotPadded}`;

  return `https://propertyinformationportal.nyc.gov/parcels/parcel/${parcelId}`;
}

/**
 * Wait for a text element to appear at the given XPath.
 * Returns the trimmed text or null on timeout.
 */
async function waitForText(
  page: Page,
  xpath: string,
  fieldName: string,
  options: { requiresDollar?: boolean } = {},
): Promise<string | null> {
  const { requiresDollar = false } = options;

  try {
    const locator = page.locator(`xpath=${xpath}`);

    await locator.waitFor({ state: 'attached', timeout: FIELD_WAIT_TIMEOUT_MS });

    // Poll until text appears (and optionally contains "$")
    const deadline = Date.now() + FIELD_WAIT_TIMEOUT_MS;
    while (Date.now() < deadline) {
      const text = (await locator.textContent())?.trim() ?? '';
      if (text && (!requiresDollar || text.includes('$'))) {
        return text;
      }
      await page.waitForTimeout(500);
    }

    console.warn(`[Scraper] Timed out waiting for ${fieldName}.`);
    return null;
  } catch {
    console.warn(`[Scraper] Timed out waiting for ${fieldName}.`);
    return null;
  }
}

// ── Main scraper function ────────────────────────────────────────────────────

/**
 * Scrape property data from the NYC Property Information Portal.
 *
 * @param borough - Borough name (e.g. "Brooklyn", "Manhattan")
 * @param block   - Block number (e.g. "1300")
 * @param lot     - Lot number (e.g. "141")
 * @returns Structured scraped data or null if scraping failed entirely
 */
export async function scrapeProperty(
  borough: string,
  block: string,
  lot: string,
): Promise<ScrapedPropertyData | null> {
  const url = buildParcelUrl(borough, block, lot);
  console.log(`[Scraper] Target URL: ${url}`);

  let browser;
  try {
    console.log('[Scraper] Launching Chromium...');
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-first-run',
        '--no-default-browser-check',
        '--window-size=1920,1080',
      ],
    });

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    const page = await context.newPage();

    console.log('[Scraper] Navigating to page...');
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });

    // Initial wait for SPA to load
    console.log('[Scraper] Waiting for page to fully load...');
    await page.waitForTimeout(INITIAL_PAGE_WAIT_MS);

    // Check for "not found" pages
    const pageContent = await page.content();
    if (
      pageContent.toLowerCase().includes('not found') ||
      pageContent.toLowerCase().includes('no results')
    ) {
      console.error('[Scraper] Property not found. Check borough, block, and lot values.');
      return null;
    }

    // Extract all fields
    const data: ScrapedPropertyData = {
      address: await waitForText(page, FIELD_XPATHS.address, 'address'),
      ownerName: await waitForText(page, FIELD_XPATHS.ownerName, 'owner name'),
      propertyType: await waitForText(page, FIELD_XPATHS.propertyType, 'property type'),
      taxClass: await waitForText(page, FIELD_XPATHS.taxClass, 'tax class'),
      yearBuilt: await waitForText(page, FIELD_XPATHS.yearBuilt, 'year built'),
      numberOfStories: await waitForText(page, FIELD_XPATHS.numberOfStories, 'number of stories'),
      totalArea: await waitForText(page, FIELD_XPATHS.totalArea, 'total area'),
      residentialUnits: await waitForText(page, FIELD_XPATHS.residentialUnits, 'residential units'),
      commercialUnits: await waitForText(page, FIELD_XPATHS.commercialUnits, 'commercial units'),
      frontage: await waitForText(page, FIELD_XPATHS.frontage, 'frontage'),
      landDepth: await waitForText(page, FIELD_XPATHS.landDepth, 'land depth'),
      landArea: await waitForText(page, FIELD_XPATHS.landArea, 'land area'),
      estimatedPrice: await waitForText(page, FIELD_XPATHS.estimatedPrice, 'price', {
        requiresDollar: true,
      }),
    };

    // Check if any data was found
    const hasAnyData = Object.values(data).some((v) => v !== null);
    if (!hasAnyData) {
      console.error(
        '[Scraper] Timed out waiting for property details. The page may not have loaded correctly.',
      );
      return null;
    }

    // Log results
    for (const [key, value] of Object.entries(data)) {
      console.log(`[Scraper] ${key}: ${value ?? 'N/A'}`);
    }

    return data;
  } catch (error) {
    console.error('[Scraper] Browser error:', error);
    return null;
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}
