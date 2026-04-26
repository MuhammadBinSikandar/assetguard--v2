import { NextResponse } from 'next/server';
import { getSolPriceUsd } from '@/lib/solana/get-sol-price';
import { apiLogger } from '@/lib/debug-logger';

export const revalidate = 60;

export async function GET() {
  try {
    apiLogger.request('GET', '/api/sol-price');
    const priceUsd = await getSolPriceUsd();
    apiLogger.response('GET', '/api/sol-price', 200, true);
    return NextResponse.json({ success: true, priceUsd }, { status: 200 });
  } catch (e) {
    console.error('[GET /api/sol-price]', e);
    return NextResponse.json(
      { success: false, message: 'Could not load SOL price.' },
      { status: 502 },
    );
  }
}
