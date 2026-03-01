-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'MANAGE_LICENSE';

-- AlterTable
ALTER TABLE "License" ADD COLUMN "lastModifiedBy" TEXT;
