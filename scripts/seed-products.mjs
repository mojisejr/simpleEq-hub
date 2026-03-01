import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_PRODUCTS = [
  {
    slug: "simple-eq",
    name: "SimpleEq Pro",
    description: "SimpleEq ecosystem core product",
    price: 0,
    isActive: true,
  },
  {
    slug: "smart-ws",
    name: "Smart-WS",
    description: "Smart worksheet product license",
    price: 0,
    isActive: true,
  },
];

const run = async () => {
  for (const product of DEFAULT_PRODUCTS) {
    await prisma.product.upsert({
      where: {
        slug: product.slug,
      },
      update: {
        name: product.name,
        description: product.description,
        price: product.price,
        isActive: product.isActive,
      },
      create: product,
    });
  }

  console.log(`[phase1] seeded products: ${DEFAULT_PRODUCTS.map((item) => item.slug).join(", ")}`);
};

run()
  .catch((error) => {
    console.error("[phase1] failed to seed products", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });