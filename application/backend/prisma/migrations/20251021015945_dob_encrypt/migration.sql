/*
  Warnings:

  - Added the required column `dobHash` to the `ParticipantProfile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ParticipantProfile" ADD COLUMN     "dobHash" TEXT NOT NULL,
ALTER COLUMN "dob" SET DATA TYPE TEXT;
