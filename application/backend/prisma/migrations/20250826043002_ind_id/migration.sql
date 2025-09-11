/*
  Warnings:

  - A unique constraint covering the columns `[individualId]` on the table `ParticipantProfile` will be added. If there are existing duplicate values, this will fail.
  - The required column `individualId` was added to the `ParticipantProfile` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "ParticipantProfile" ADD COLUMN     "individualId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ParticipantProfile_individualId_key" ON "ParticipantProfile"("individualId");
