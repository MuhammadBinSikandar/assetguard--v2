import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/db/prismaClient';
import { getUserFromAccessToken } from '@/lib/auth';
import { scrapeProperty } from '@/lib/scraper/scrape-property';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  let propertyIdForScrape: string | null = null;

  try {
    // Auth + Admin check
    const decoded = await getUserFromAccessToken();
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Please log in.' },
        { status: 401 },
      );
    }
    if (!decoded.roles.includes('admin')) {
      return NextResponse.json(
        { success: false, message: 'Forbidden. Admin access required.' },
        { status: 403 },
      );
    }

    // Parse body
    const body = await request.json();
    const { propertyId } = body as { propertyId?: string };

    if (!propertyId || typeof propertyId !== 'string') {
      return NextResponse.json(
        { success: false, message: 'propertyId is required.' },
        { status: 400 },
      );
    }

    propertyIdForScrape = propertyId;

    // Find the property
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true, borough: true, block: true, lot: true },
    });

    if (!property) {
      return NextResponse.json(
        { success: false, message: 'Property not found.' },
        { status: 404 },
      );
    }

    // Upsert verification record to PENDING
    await prisma.propertyVerificationData.upsert({
      where: { propertyId },
      update: {
        scrapeStatus: 'PENDING',
        scrapeError: null,
      },
      create: {
        propertyId,
        scrapeStatus: 'PENDING',
      },
    });

    let result;
    try {
      result = await scrapeProperty(property.borough, property.block, property.lot);
    } catch (scrapeErr) {
      const msg =
        scrapeErr instanceof Error ? scrapeErr.message : 'Scraper threw an unexpected error.';
      await prisma.propertyVerificationData.update({
        where: { propertyId },
        data: {
          scrapeStatus: 'FAILED',
          scrapedAt: new Date(),
          scrapeError: msg,
        },
      });
      return NextResponse.json(
        { success: false, message: msg },
        { status: 502 },
      );
    }

    if (result) {
      const updated = await prisma.propertyVerificationData.update({
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

      return NextResponse.json(
        {
          success: true,
          message: 'Verification data scraped successfully.',
          data: updated,
        },
        { status: 200 },
      );
    }

    await prisma.propertyVerificationData.update({
      where: { propertyId },
      data: {
        scrapeStatus: 'FAILED',
        scrapedAt: new Date(),
        scrapeError: 'Scraper returned no data. The page may not have loaded correctly.',
      },
    });

    return NextResponse.json(
      {
        success: false,
        message: 'Scraping failed. The page may not have loaded correctly.',
      },
      { status: 502 },
    );
  } catch (error) {
    console.error('[Admin Rescrape] Error:', error);
    const message = error instanceof Error ? error.message : 'An error occurred while re-scraping.';
    if (propertyIdForScrape) {
      try {
        await prisma.propertyVerificationData.update({
          where: { propertyId: propertyIdForScrape },
          data: {
            scrapeStatus: 'FAILED',
            scrapedAt: new Date(),
            scrapeError: message,
          },
        });
      } catch (dbErr) {
        console.error('[Admin Rescrape] Failed to persist error status:', dbErr);
      }
    }
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
