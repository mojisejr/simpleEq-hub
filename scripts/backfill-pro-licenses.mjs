import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const run = async () => {
  const simpleEqProduct = await prisma.product.findUnique({
    where: {
      slug: "simple-eq",
    },
    select: {
      id: true,
    },
  });

  if (!simpleEqProduct) {
    throw new Error("Product 'simple-eq' was not found. Run phase1:seed-products first.");
  }

  const proUsers = await prisma.user.findMany({
    where: {
      subscriptionStatus: "PRO",
    },
    select: {
      id: true,
    },
  });

  const inserted = await prisma.license.createMany({
    data: proUsers.map((user) => ({
      userId: user.id,
      productId: simpleEqProduct.id,
      isActive: true,
    })),
    skipDuplicates: true,
  });

  console.log(`[phase1] processed PRO users: ${proUsers.length}`);
  console.log(`[phase1] newly created simple-eq licenses: ${inserted.count}`);
};

run()
  .catch((error) => {
    console.error("[phase1] failed to backfill licenses", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });