import { PrismaClient } from '@prisma/client';

/**
 * Prisma Client Singleton
 * Prevents multiple instances in development with hot reloading
 */

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  }).$extends({
    query: {
      $allOperations: async ({ operation, model, args, query }) => {
        // Retry logic for Neon database wake-up
        const maxRetries = 3;
        let lastError: Error | undefined;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            return await query(args);
          } catch (error) {
            lastError = error as Error;
            
            // Only retry on connection errors
            if (
              error instanceof Error &&
              (error.message.includes("Can't reach database server") ||
               error.message.includes('Connection terminated') ||
               error.message.includes('Connection lost'))
            ) {
              if (attempt < maxRetries) {
                console.log(`Database connection attempt ${attempt} failed, retrying...`);
                // Wait before retry (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, attempt * 1000));
                continue;
              }
            }
            
            // Don't retry other errors
            throw error;
          }
        }
        
        throw lastError;
      },
    },
  }) as unknown as PrismaClient;
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
