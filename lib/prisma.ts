import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  (() => {
    const connectionString = process.env.POSTGRES_PRISMA_URL ?? process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error("Missing database connection string. Set POSTGRES_PRISMA_URL or DATABASE_URL.");
    }

    const pool = new Pool({
      connectionString,
    });

    return new PrismaClient({
      adapter: new PrismaPg(pool),
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
  })();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}