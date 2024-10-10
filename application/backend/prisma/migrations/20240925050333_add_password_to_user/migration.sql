-- AlterTable

ALTER TABLE "User" ADD COLUMN "password" TEXT;

UPDATE "User" SET "password" = 'temp_password_hash' IS NULL;

ALTER TABLE "User" ALTER COLUMN "password" SET NOT NULL;
