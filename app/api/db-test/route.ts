import { NextResponse } from 'next/server';
import prisma, { testDatabaseConnection } from '@/db/prismaClient';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  try {
    // 1. Basic connection test
    const connectionResult = await testDatabaseConnection();
    
    if (!connectionResult.success) {
      return NextResponse.json({
        success: false,
        message: 'Direct DB connection failed',
        error: connectionResult.error,
        duration: `${Date.now() - startTime}ms`
      }, { status: 500 });
    }

    // 2. Test a real table query (User count)
    // This verifies that the schema is correct and permissions are working
    const userCount = await prisma.user.count();
    
    const endTime = Date.now();
    const duration = endTime - startTime;

    return NextResponse.json({
      success: true,
      message: 'Database connection is healthy',
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      details: {
        connection: 'Connected',
        latency: duration,
        userCount: userCount,
        // Safe check to confirm which DB we are hitting (masked)
        env_check: process.env.DATABASE_URL ? 'Variable Set' : 'Variable Missing'
      }
    }, { status: 200 });

  } catch (error) {
    console.error('DB Test Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Unexpected error during database test',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
