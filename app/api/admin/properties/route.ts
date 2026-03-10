import { NextRequest, NextResponse } from 'next/server';
import { getUserFromAccessToken } from '@/lib/auth';
import { getAdminPropertiesList } from '@/lib/data/properties';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const search = searchParams.get('search') || undefined;

    const result = await getAdminPropertiesList({ status, page, limit, search });

    return NextResponse.json({ success: true, ...result }, { status: 200 });
  } catch (error) {
    console.error('[Admin Properties List] Error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while fetching properties.' },
      { status: 500 },
    );
  }
}
