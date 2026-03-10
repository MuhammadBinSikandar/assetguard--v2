import { NextRequest, NextResponse } from 'next/server';
import { getUserFromAccessToken } from '@/lib/auth';
import { getAdminPropertyDetail } from '@/lib/data/properties';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

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

    const property = await getAdminPropertyDetail(id);

    if (!property) {
      return NextResponse.json(
        { success: false, message: 'Property not found.' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: property }, { status: 200 });
  } catch (error) {
    console.error('[Admin Property Detail] Error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while fetching property details.' },
      { status: 500 },
    );
  }
}
