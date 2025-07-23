/*
  Warnings:

  - A unique constraint covering the columns `[studyId,emailHash]` on the table `Invite` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[emailHash]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Invite_studyId_email_key";

-- AlterTable
ALTER TABLE "Invite" ADD COLUMN     "emailHash" TEXT;

-- AlterTable
ALTER TABLE "ParticipantProfile" ADD COLUMN     "firstNameHash" TEXT,
ADD COLUMN     "lastNameHash" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Invite_studyId_emailHash_key" ON "Invite"("studyId", "emailHash");

-- CreateIndex
CREATE UNIQUE INDEX "User_emailHash_key" ON "User"("emailHash");
