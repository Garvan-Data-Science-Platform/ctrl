/*
  Warnings:

  - You are about to drop the column `relationship` on the `AlternativeContact` table. All the data in the column will be lost.
  - You are about to drop the column `participantID` on the `ParticipantProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AlternativeContact" DROP COLUMN "relationship";

-- AlterTable
ALTER TABLE "ParticipantProfile" DROP COLUMN "participantID";

-- DropEnum
DROP TYPE "RelationshipType";
