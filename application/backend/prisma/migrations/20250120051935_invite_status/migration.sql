-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');
-- AlterTable
ALTER TABLE "Invite"
ADD COLUMN "expiresAt" TIMESTAMP(3) NOT NULL,
  ADD COLUMN "status" "InviteStatus" NOT NULL DEFAULT 'PENDING';
-- CreateIndex
CREATE UNIQUE INDEX "Invite_email_key" ON "Invite"("email");