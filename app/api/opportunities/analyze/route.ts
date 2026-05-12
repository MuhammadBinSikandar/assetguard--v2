// app/api/opportunities/analyze/route.ts
// Authenticated endpoint that streams an AI-generated analysis for a property's ROI
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/db/prismaClient';
import { getUserFromAccessToken } from '@/lib/auth';

const FLASK_URL = process.env.FLASK_ML_URL || 'http://localhost:5000';

function normaliseBoroughForFlask(borough: string): string {
  return borough.toLowerCase().replace(/ /g, '_');
}

export async function POST(request: NextRequest) {
  try {
    // 1. Auth
    const decoded = await getUserFromAccessToken();
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized.' },
        { status: 401 },
      );
    }

    const body = await request.json();
    const propertyId = body.propertyId as string;
    if (!propertyId) {
      return NextResponse.json(
        { success: false, message: 'Missing propertyId.' },
        { status: 400 },
      );
    }

    // 2. Fetch property
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

    // 3. Fetch ROI data from Flask
    const v = property.verificationData;
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
    const taxClass = (v?.taxClass ?? property.taxClass) ?? '1';

    const payload = {
      borough: normaliseBoroughForFlask(property.borough),
      block: parseInt(property.block, 10) || 0,
      lot: parseInt(property.lot, 10) || 0,
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

    let roiData: any = null;
    try {
      const flaskRes = await fetch(`${FLASK_URL}/api/predict_roi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (flaskRes.ok) {
        roiData = await flaskRes.json();
      }
    } catch {
      // Flask might be down — proceed with what we have
    }

    // 4. Build analysis text (streamed as SSE)
    const analysisLines = generateAnalysis(property, roiData);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        for (const line of analysisLines) {
          const chunk = `data: ${JSON.stringify({ text: line })}\n\n`;
          controller.enqueue(encoder.encode(chunk));
          // Simulate streaming delay
          await new Promise((r) => setTimeout(r, 80));
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[Analyze] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Analysis failed.' },
      { status: 500 },
    );
  }
}

function generateAnalysis(property: any, roiData: any): string[] {
  const lines: string[] = [];

  lines.push(`## Property Analysis: ${property.propertyAddress}`);
  lines.push('');
  lines.push(`**Borough:** ${property.borough} | **Block:** ${property.block} | **Lot:** ${property.lot}`);
  lines.push(`**Type:** ${property.propertyType.replace('_', ' ')}`);
  lines.push('');

  if (roiData?.success) {
    const baseline = roiData.baseline_price;
    const projections = roiData.projections || [];
    const last = projections[projections.length - 1];

    lines.push('### ROI Projection Summary');
    lines.push(`- **Baseline Valuation:** $${baseline?.toLocaleString() ?? 'N/A'}`);

    if (last) {
      lines.push(`- **10-Year Projected Price:** $${last.projected_price?.toLocaleString()}`);
      lines.push(`- **Total Profit:** $${last.profit?.toLocaleString()}`);
      lines.push(`- **ROI Percentage:** ${last.roi_percentage?.toFixed(2)}%`);
      lines.push('');

      if (last.roi_percentage >= 5) {
        lines.push('### 📈 Strong Investment Signal');
        lines.push('This property demonstrates above-average growth potential based on historical sales data, location factors, and market trends in the borough. The projected appreciation exceeds the NYC average.');
      } else if (last.roi_percentage >= 2) {
        lines.push('### 📊 Moderate Investment');
        lines.push('This property shows moderate growth potential. Consider this as a stable, lower-risk holding that tracks close to inflation-adjusted returns. Suitable for conservative portfolios.');
      } else {
        lines.push('### ⚠️ Below-Average Returns');
        lines.push('Current projections suggest below-average returns for this property. Factors such as building age, location saturation, or market conditions may be limiting growth. Exercise caution.');
      }
    }

    lines.push('');
    lines.push('### Year-by-Year Outlook');
    for (const p of projections.slice(0, 5)) {
      lines.push(`- **${p.year}:** $${p.projected_price?.toLocaleString()} (${p.roi_percentage?.toFixed(2)}% ROI)`);
    }
    if (projections.length > 5) {
      lines.push(`- *...and ${projections.length - 5} more years projected*`);
    }
  } else {
    lines.push('### ROI Data Unavailable');
    lines.push('The ML model could not generate projections for this property at this time. This may be due to insufficient comparable sales data or service availability.');
  }

  lines.push('');
  lines.push('---');
  lines.push('*Analysis generated by AssetGuard ML Pipeline. Projections are estimates based on historical NYC property sales data and are not financial advice.*');

  return lines;
}
