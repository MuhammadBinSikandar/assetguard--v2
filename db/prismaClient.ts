import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';

/**
 * Prisma Client Singleton
 * Prevents multiple instances in development with hot reloading
 */

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prismaClientSingleton = () => {
  const datasourceUrl = process.env.DATABASE_URL;
  if (!datasourceUrl) {
    throw new Error('DATABASE_URL is not set for Prisma');
  }

  const adapter = new PrismaNeon(datasourceUrl);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
};

const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

export default prisma;

// Helper function to disconnect Prisma (useful for tests and cleanup)
export async function disconnectPrisma() {
  await prisma.$disconnect();
}

// Helper function to test database connection
export async function testDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { success: true, message: 'Database connection successful' };
  } catch (error) {
    return {
      success: false,
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
