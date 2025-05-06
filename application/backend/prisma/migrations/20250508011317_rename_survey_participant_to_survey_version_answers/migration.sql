/*
  Warnings:

  - You are about to drop the `SurveyParticipant` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "SurveyParticipant" DROP CONSTRAINT "SurveyParticipant_profileId_fkey";

-- DropForeignKey
ALTER TABLE "SurveyParticipant" DROP CONSTRAINT "SurveyParticipant_versionId_fkey";

-- DropTable
DROP TABLE "SurveyParticipant";

-- CreateTable
CREATE TABLE "SurveyVersionAnswers" (
    "id" SERIAL NOT NULL,
    "versionId" INTEGER NOT NULL,
    "profileId" INTEGER NOT NULL,
    "answers" JSONB NOT NULL,
    "derived" TEXT,

    CONSTRAINT "SurveyVersionAnswers_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SurveyVersionAnswers" ADD CONSTRAINT "SurveyVersionAnswers_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "SurveyVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyVersionAnswers" ADD CONSTRAINT "SurveyVersionAnswers_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "ParticipantProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
