import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var cachedPrisma: PrismaClient | undefined;
}

let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  if (!global.cachedPrisma) {
    global.cachedPrisma = new PrismaClient({
      log: process.env.DEBUG === "prisma" ? ["query", "error", "warn"] : ["error"],
    });
  }
  prisma = global.cachedPrisma;
}

export const db = prisma;
