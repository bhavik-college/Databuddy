import { PrismaClient } from "../generated/client";

export * from '../generated/client';


/**
 * Get a properly configured PrismaClient instance
 */
const getPrismaClient = () => {
  return new PrismaClient({
    // log: ['error'],
  });
};

// Add prisma to the global type
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient;
};

// Export a singleton instance of PrismaClient
export const prisma = globalForPrisma.prisma ?? getPrismaClient();

// Prevent multiple instances during development due to HMR
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
