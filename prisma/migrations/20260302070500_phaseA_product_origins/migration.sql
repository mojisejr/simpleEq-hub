-- AlterTable
ALTER TABLE "Product"
ADD COLUMN "extensionId" TEXT,
ADD COLUMN "allowedOrigins" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE UNIQUE INDEX "Product_extensionId_key" ON "Product"("extensionId");
