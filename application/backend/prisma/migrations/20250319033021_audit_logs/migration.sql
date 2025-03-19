-- CreateEnum
CREATE TYPE "AuditLogResource" AS ENUM ('USER', 'PROFILE', 'SURVEY_VERSION', 'SURVEY_PARTICIPANT');

-- CreateEnum
CREATE TYPE "AuditLogOperation" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deleted" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" SERIAL NOT NULL,
    "resource" "AuditLogResource" NOT NULL,
    "operation" "AuditLogOperation" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER,
    "meta" JSONB NOT NULL,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
