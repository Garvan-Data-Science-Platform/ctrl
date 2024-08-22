-- AlterTable
ALTER TABLE "User" ADD COLUMN "updatedAt" TIMESTAMP(3);

UPDATE "User" SET "updatedAt" = COALESCE("updatedAt", "createdAt");

ALTER TABLE "User" ALTER COLUMN "updatedAt" SET NOT NULL;
