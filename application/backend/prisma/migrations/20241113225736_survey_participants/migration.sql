/*
  Warnings:

  - You are about to drop the `StudyParticipant` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "StudyParticipant" DROP CONSTRAINT "StudyParticipant_profileId_fkey";

-- DropForeignKey
ALTER TABLE "StudyParticipant" DROP CONSTRAINT "StudyParticipant_studyId_fkey";

-- DropForeignKey
ALTER TABLE "StudyParticipant" DROP CONSTRAINT "StudyParticipant_versionId_fkey";

-- AlterTable
ALTER TABLE "SurveyVersion" ADD COLUMN     "studyId" INTEGER NOT NULL DEFAULT 1;

-- DropTable
DROP TABLE "StudyParticipant";

-- CreateTable
CREATE TABLE "SurveyParticipant" (
    "id" SERIAL NOT NULL,
    "versionId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "SurveyParticipant_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SurveyVersion" ADD CONSTRAINT "SurveyVersion_studyId_fkey" FOREIGN KEY ("studyId") REFERENCES "Study"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyParticipant" ADD CONSTRAINT "SurveyParticipant_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "SurveyVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyParticipant" ADD CONSTRAINT "SurveyParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
