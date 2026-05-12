// app/api/opportunities/borough-stats/route.ts
// Public endpoint — fetches all verified properties, calls Flask for each,
// aggregates per-borough stats. Cached for 1 hour via Next.js revalidation.
import { NextResponse } from 'next/server';
import prisma from '@/db/prismaClient';
import type { BoroughStat } from '@/types/roi';

const FLASK_URL = process.env.FLASK_ML_URL || 'http://localhost:5000';

function normaliseBoroughForFlask(borough: string): string {
  return borough.toLowerCase().replace(/ /g, '_');
}

// Concurrency-limited Promise.all helper
async function promiseAllSettledWithLimit<T>(
  tasks: (() => Promise<T>)[],
  limit: number,
): Promise<PromiseSettledResult<T>[]> {
  const results: PromiseSettledResult<T>[] = [];
  let index = 0;

  async function runNext(): Promise<void> {
    while (index < tasks.length) {
      const i = index++;
      try {
        const value = await tasks[i]();
        results[i] = { status: 'fulfilled', value };
      } catch (reason) {
        results[i] = { status: 'rejected', reason };
      }
    }
  }

  const workers = Array.from({ length: Math.min(limit, tasks.length) }, () => runNext());
  await Promise.all(workers);
  return results;
}

type PropertyForROI = {
  id: string;
  borough: string;
  block: string;
  lot: string;
  totalAreaSqFt: number | null;
  landAreaSqFt: number | null;
  yearBuilt: number | null;
  residentialUnits: number | null;
  commercialUnits: number | null;
  taxClass: string;
  verificationData: {
    totalArea: string | null;
    landArea: string | null;
    yearBuilt: string | null;
    residentialUnits: string | null;
    commercialUnits: string | null;
    taxClass: string | null;
  } | null;
};

async function fetchROIForProperty(
  p: PropertyForROI,
): Promise<{ borough: string; roi: number } | null> {
  try {
    const v = p.verificationData;
    const grossSquareFeet =
      (v?.totalArea ? parseFloat(v.totalArea) : null) ?? p.totalAreaSqFt ?? 0;
    const landSquareFeet =
      (v?.landArea ? parseFloat(v.landArea) : null) ?? p.landAreaSqFt ?? 0;
    const yearBuilt =
      (v?.yearBuilt ? parseInt(v.yearBuilt, 10) : null) ?? p.yearBuilt ?? 1990;
    const residentialUnits =
      (v?.residentialUnits ? parseInt(v.residentialUnits, 10) : null) ??
      p.residentialUnits ??
      0;
    const commercialUnits =
      (v?.commercialUnits ? parseInt(v.commercialUnits, 10) : null) ??
      p.commercialUnits ??
      0;
    const totalUnits = residentialUnits + commercialUnits;
    const taxClass = (v?.taxClass ? v.taxClass : null) ?? p.taxClass ?? '1';

    const payload = {
      borough: normaliseBoroughForFlask(p.borough),
      block: parseInt(p.block, 10) || 0,
      lot: parseInt(p.lot, 10) || 0,
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

    const res = await fetch(`${FLASK_URL}/api/predict_roi`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (!data.success || !data.projections?.length) return null;

    // Use the final year projection
    const lastProjection = data.projections[data.projections.length - 1];
    return { borough: p.borough, roi: lastProjection.roi_percentage ?? 0 };
  } catch {
    return null;
  }
}

// In-memory cache: value + timestamp
let cachedResult: { data: BoroughStat[]; at: number } | null = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function GET() {
  try {
    // Check cache
    if (cachedResult && Date.now() - cachedResult.at < CACHE_TTL) {
      return NextResponse.json({ boroughs: cachedResult.data }, { status: 200 });
    }

    // Fetch all APPROVED properties
    const properties = await prisma.property.findMany({
      where: { status: 'APPROVED' },
      select: {
        id: true,
        borough: true,
        block: true,
        lot: true,
        totalAreaSqFt: true,
        landAreaSqFt: true,
        yearBuilt: true,
        residentialUnits: true,
        commercialUnits: true,
        taxClass: true,
        verificationData: {
          select: {
            totalArea: true,
            landArea: true,
            yearBuilt: true,
            residentialUnits: true,
            commercialUnits: true,
            taxClass: true,
          },
        },
      },
    });

    // Fetch ROIs concurrently with limit of 5
    const tasks = properties.map(
      (p) => () => fetchROIForProperty(p as PropertyForROI),
    );
    const settled = await promiseAllSettledWithLimit(tasks, 5);

    // Aggregate per-borough
    const boroughMap = new Map<
      string,
      { totalROI: number; count: number; topROI: number }
    >();

    for (const result of settled) {
      if (result.status !== 'fulfilled' || !result.value) continue;
      const { borough, roi } = result.value;
      const normalised =
        borough.charAt(0).toUpperCase() + borough.slice(1).toLowerCase();
      const existing = boroughMap.get(normalised) ?? {
        totalROI: 0,
        count: 0,
        topROI: 0,
      };
      existing.totalROI += roi;
      existing.count += 1;
      existing.topROI = Math.max(existing.topROI, roi);
      boroughMap.set(normalised, existing);
    }

    const boroughs: BoroughStat[] = Array.from(boroughMap.entries()).map(
      ([name, stats]) => ({
        name,
        avgROI: Math.round((stats.totalROI / stats.count) * 100) / 100,
        propertyCount: stats.count,
        topROI: Math.round(stats.topROI * 100) / 100,
      }),
    );

    // Update cache
    cachedResult = { data: boroughs, at: Date.now() };

    return NextResponse.json({ boroughs }, { status: 200 });
  } catch (error) {
    console.error('[Borough Stats] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to compute borough stats.' },
      { status: 500 },
    );
  }
}
