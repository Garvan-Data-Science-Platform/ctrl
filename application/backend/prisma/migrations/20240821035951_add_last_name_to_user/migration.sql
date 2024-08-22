-- AlterTable
ALTER TABLE "User" ADD COLUMN "lastName" TEXT;

UPDATE "User" SET "lastName" = 'UNKNOWN' WHERE "lastName" IS NULL;

ALTER TABLE "User" ALTER COLUMN "lastName" SET NOT NULL;
