import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Get pending verification email from secure cookie
 * This prevents exposing email addresses in URLs
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const emailCookie = cookieStore.get('pending_verification_email');

    if (!emailCookie?.value) {
      return NextResponse.json(
        {
          success: false,
          message: 'No pending verification found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        email: emailCookie.value,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error retrieving pending email:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to retrieve verification email',
      },
      { status: 500 }
    );
  }
}
