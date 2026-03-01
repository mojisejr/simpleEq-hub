-- Add MASTER role for super admin authorization
ALTER TYPE "UserRole" ADD VALUE 'MASTER';

-- Product catalog for multi-product licensing
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- License relation: one identity can hold many product licenses
CREATE TABLE "License" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "grantedBy" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "License_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "License_userId_productId_key" ON "License"("userId", "productId");
CREATE INDEX "License_userId_idx" ON "License"("userId");
CREATE INDEX "License_productId_idx" ON "License"("productId");

ALTER TABLE "License"
ADD CONSTRAINT "License_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "License"
ADD CONSTRAINT "License_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed default product catalog
INSERT INTO "Product" ("id", "slug", "name", "description", "price", "isActive", "createdAt", "updatedAt")
VALUES
  ('prod_simple_eq', 'simple-eq', 'SimpleEq Pro', 'SimpleEq ecosystem core product', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('prod_smart_ws', 'smart-ws', 'Smart-WS', 'Smart worksheet product license', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO UPDATE
SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "isActive" = EXCLUDED."isActive",
  "updatedAt" = CURRENT_TIMESTAMP;

-- Backfill existing PRO users to SimpleEq license without breaking legacy status checks
INSERT INTO "License" ("id", "userId", "productId", "isActive", "grantedAt", "createdAt", "updatedAt")
SELECT
  CONCAT('lic_backfill_', u."id", '_simple_eq'),
  u."id",
  p."id",
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "User" u
INNER JOIN "Product" p ON p."slug" = 'simple-eq'
WHERE u."subscriptionStatus" = 'PRO'
  AND NOT EXISTS (
    SELECT 1
    FROM "License" l
    WHERE l."userId" = u."id"
      AND l."productId" = p."id"
  );