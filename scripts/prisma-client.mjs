import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const connectionString =
  process.env.POSTGRES_PRISMA_URL ??
  process.env.DATABASE_URL ??
  process.env.POSTGRES_URL ??
  process.env.POSTGRES_URL_NON_POOLING;

if (!connectionString) {
  throw new Error(
    "Missing database connection string. Set one of: POSTGRES_PRISMA_URL, DATABASE_URL, POSTGRES_URL, POSTGRES_URL_NON_POOLING.",
  );
}

const pool = new Pool({
  connectionString,
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

const disconnectPrisma = async () => {
  await prisma.$disconnect();
  await pool.end();
};

export { disconnectPrisma, prisma };