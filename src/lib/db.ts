import { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';

// Type for D1 database binding
export type D1Database = any;

// Create PrismaClient with D1 adapter
export function createDb(d1: D1Database) {
  const adapter = new PrismaD1(d1);
  return new PrismaClient({ adapter });
}

// For development: use local SQLite file
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getDevDb(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      log: ['query', 'error', 'warn'],
    });
  }
  return globalForPrisma.prisma;
}

/**
 * Get database client
 * - In development: uses local SQLite
 * - In production (edge): uses D1 binding from request context
 */
export async function getDb(): Promise<PrismaClient> {
  // In development, use local SQLite
  if (process.env.NODE_ENV === 'development') {
    return getDevDb();
  }

  // In production (edge runtime), get D1 binding from request context
  const { getRequestContext } = await import('@cloudflare/next-on-pages');
  const { env } = getRequestContext();
  return createDb(env.DB);
}

// Export for convenience (development only)
export const db = getDevDb();
