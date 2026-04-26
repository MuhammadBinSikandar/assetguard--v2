import { NextRequest, NextResponse } from 'next/server';
import { PinataSDK } from 'pinata';
import { getUserFromAccessToken } from '@/lib/auth';

export const runtime = 'nodejs';

type LegacyPrivateGatewayApi = {
  createSignedURL?: (options: { cid: string; expires: number }) => Promise<string>;
  createAccessLink?: (options: { cid: string; expires: number }) => Promise<string>;
};

/**
 * Admin-only: return a short-lived signed URL for a KYC document stored by Pinata CID.
 * Never persist this URL — fetch on each view.
 */
export async function GET(request: NextRequest) {
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

  const cid = request.nextUrl.searchParams.get('cid');
  if (!cid?.trim()) {
    return NextResponse.json(
      { success: false, message: 'Query parameter "cid" is required.' },
      { status: 400 },
    );
  }

  const pinata = new PinataSDK({
    pinataJwt: process.env.PINATA_JWT,
    pinataGateway: process.env.PINATA_GATEWAY,
  });

  const privateGateway = pinata.gateways.private as unknown as LegacyPrivateGatewayApi;

  try {
    let url: string;
    if (typeof privateGateway.createSignedURL === 'function') {
      url = await privateGateway.createSignedURL({ cid: cid.trim(), expires: 300 });
    } else if (typeof privateGateway.createAccessLink === 'function') {
      url = await privateGateway.createAccessLink({ cid: cid.trim(), expires: 300 });
    } else {
      return NextResponse.json(
        { success: false, message: 'Pinata private gateway signed URL API is unavailable.' },
        { status: 500 },
      );
    }

    return NextResponse.json({ url }, { status: 200 });
  } catch (e) {
    console.error('[Admin KYC Document] Pinata error:', e);
    return NextResponse.json(
      { success: false, message: 'Failed to create signed URL for this document.' },
      { status: 502 },
    );
  }
}
