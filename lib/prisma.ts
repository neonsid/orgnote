import "dotenv/config";
import { PrismaClient } from "./generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma } from "./generated/prisma/client";

const isDev = process.env.NODE_ENV === "development";
const SLOW_QUERY_THRESHOLD_MS = 200;

const databaseUrl = isDev
  ? process.env.DEV_DATABASE_URL
  : process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    isDev ? "DEV_DATABASE_URL is not set" : "DATABASE_URL is not set",
  );
}

const withQueryTiming = Prisma.defineExtension({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const start = performance.now();
        const result = await query(args);
        const duration = performance.now() - start;
        const durationMs = duration.toFixed(2);

        if (duration > SLOW_QUERY_THRESHOLD_MS) {
          console.warn(
            `🐢 SLOW QUERY [${model}.${operation}]: ${durationMs}ms`,
          );
        } else if (isDev) {
          console.log(`⚡ [${model}.${operation}]: ${durationMs}ms`);
        }

        return result;
      },
    },
  },
});

let prisma: PrismaClient;

if (isDev) {
  // Use local PostgreSQL (Docker) in development
  const adapter = new PrismaPg({ connectionString: databaseUrl });
  prisma = new PrismaClient({ adapter }).$extends(
    withQueryTiming,
  ) as unknown as PrismaClient;
} else {
  // Use Neon in production
  const adapter = new PrismaNeon({ connectionString: databaseUrl });
  prisma = new PrismaClient({ adapter }).$extends(
    withQueryTiming,
  ) as unknown as PrismaClient;
}

export { prisma };
