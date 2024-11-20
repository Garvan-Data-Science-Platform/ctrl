/*
  Warnings:

  - You are about to drop the column `isParentOrGuardian` on the `ParticipantProfile` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `SurveyParticipant` table. All the data in the column will be lost.
  - You are about to drop the `OnBehalf` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SurveyAnswers` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `firstName` to the `ParticipantProfile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `ParticipantProfile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `participantType` to the `ParticipantProfile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `answers` to the `SurveyParticipant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `profileId` to the `SurveyParticipant` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ParticipantType" AS ENUM ('STANDARD', 'GUARDIAN', 'DEPENDENT_AGE', 'DEPENDENT_OTHER');

-- DropForeignKey
ALTER TABLE "OnBehalf" DROP CONSTRAINT "OnBehalf_participantProfileId_fkey";

-- DropForeignKey
ALTER TABLE "ParticipantProfile" DROP CONSTRAINT "ParticipantProfile_userId_fkey";

-- DropForeignKey
ALTER TABLE "SurveyAnswers" DROP CONSTRAINT "SurveyAnswers_participantId_fkey";

-- DropForeignKey
ALTER TABLE "SurveyParticipant" DROP CONSTRAINT "SurveyParticipant_userId_fkey";

-- DropIndex
DROP INDEX "ParticipantProfile_userId_key";

-- AlterTable
ALTER TABLE "ParticipantProfile" DROP COLUMN "isParentOrGuardian",
ADD COLUMN     "familyId" SERIAL NOT NULL,
ADD COLUMN     "firstName" TEXT NOT NULL,
ADD COLUMN     "lastName" TEXT NOT NULL,
ADD COLUMN     "middleName" TEXT,
ADD COLUMN     "participantType" "ParticipantType" NOT NULL,
ADD COLUMN     "studyId" INTEGER NOT NULL DEFAULT 1,
ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "SurveyParticipant" DROP COLUMN "userId",
ADD COLUMN     "answers" JSONB NOT NULL,
ADD COLUMN     "profileId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "OnBehalf";

-- DropTable
DROP TABLE "SurveyAnswers";

-- AddForeignKey
ALTER TABLE "ParticipantProfile" ADD CONSTRAINT "ParticipantProfile_studyId_fkey" FOREIGN KEY ("studyId") REFERENCES "Study"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipantProfile" ADD CONSTRAINT "ParticipantProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyParticipant" ADD CONSTRAINT "SurveyParticipant_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "ParticipantProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
