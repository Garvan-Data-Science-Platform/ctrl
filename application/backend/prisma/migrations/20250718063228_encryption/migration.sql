/*
  Warnings:

  - A unique constraint covering the columns `[emailHash]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Invite" ADD COLUMN     "emailHash" TEXT;

-- AlterTable
ALTER TABLE "ParticipantProfile" ADD COLUMN     "firstNameHash" TEXT,
ADD COLUMN     "lastNameHash" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_emailHash_key" ON "User"("emailHash");
