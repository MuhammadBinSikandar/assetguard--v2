// app/api/roi/[propertyId]/route.ts
// Server-side proxy to Flask ML ROI prediction endpoint
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/db/prismaClient';
import { getUserFromAccessToken } from '@/lib/auth';

const FLASK_URL = process.env.FLASK_ML_URL || 'http://localhost:5000';

/**
 * Borough name → lowercase slug for Flask API
 * e.g. "Manhattan" → "manhattan", "Staten Island" → "staten_island"
 */
function normaliseBoroughForFlask(borough: string): string {
  return borough.toLowerCase().replace(/ /g, '_');
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ propertyId: string }> },
) {
  try {
    // 1. Authenticate
    const decoded = await getUserFromAccessToken();
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Please log in.' },
        { status: 401 },
      );
    }

    const { propertyId } = await params;

    // 2. Fetch property + verification data
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: { verificationData: true },
    });

    if (!property) {
      return NextResponse.json(
        { success: false, message: 'Property not found.' },
        { status: 404 },
      );
    }

    // 3. Build Flask payload — prefer verification data, fall back to property
    const v = property.verificationData;

    const borough = normaliseBoroughForFlask(property.borough);
    const block = parseInt(v?.address ? property.block : property.block, 10) || 0;
    const lot = parseInt(property.lot, 10) || 0;

    const grossSquareFeet =
      (v?.totalArea ? parseFloat(v.totalArea) : null) ?? property.totalAreaSqFt ?? 0;
    const landSquareFeet =
      (v?.landArea ? parseFloat(v.landArea) : null) ?? property.landAreaSqFt ?? 0;
    const yearBuilt =
      (v?.yearBuilt ? parseInt(v.yearBuilt, 10) : null) ?? property.yearBuilt ?? 1990;
    const residentialUnits =
      (v?.residentialUnits ? parseInt(v.residentialUnits, 10) : null) ??
      property.residentialUnits ??
      0;
    const commercialUnits =
      (v?.commercialUnits ? parseInt(v.commercialUnits, 10) : null) ??
      property.commercialUnits ??
      0;
    const totalUnits = residentialUnits + commercialUnits;
    const taxClass =
      (v?.taxClass ? v.taxClass : null) ?? property.taxClass ?? '1';

    const payload = {
      borough,
      block,
      lot,
      gross_square_feet: grossSquareFeet,
      land_square_feet: landSquareFeet,
      year_built: yearBuilt,
      residential_units: residentialUnits,
      commercial_units: commercialUnits,
      total_units: totalUnits,
      current_year: new Date().getFullYear(),
      years_to_project: 10,
      condition_multiplier: 1.0,
      tax_class: taxClass,
    };

    // 4. POST to Flask
    const flaskRes = await fetch(`${FLASK_URL}/api/predict_roi`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!flaskRes.ok) {
      console.error('[ROI] Flask returned', flaskRes.status, await flaskRes.text());
      return NextResponse.json(
        { success: false, message: 'ML service unavailable.' },
        { status: 502 },
      );
    }

    const data = await flaskRes.json();

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('[ROI] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 },
    );
  }
}
