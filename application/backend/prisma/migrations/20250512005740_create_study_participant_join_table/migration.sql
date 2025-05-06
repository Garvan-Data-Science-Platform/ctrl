/*
  Warnings:

  - You are about to drop the column `studyId` on the `ParticipantProfile` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ParticipantProfile" DROP CONSTRAINT "ParticipantProfile_studyId_fkey";

-- AlterTable
ALTER TABLE "ParticipantProfile" DROP COLUMN "studyId";

-- AlterTable
ALTER TABLE "SurveyVersion" ALTER COLUMN "studyId" DROP DEFAULT;

-- CreateTable
CREATE TABLE "StudyParticipant" (
    "participantProfileId" INTEGER NOT NULL,
    "studyId" INTEGER NOT NULL,

    CONSTRAINT "StudyParticipant_pkey" PRIMARY KEY ("participantProfileId","studyId")
);

-- AddForeignKey
ALTER TABLE "StudyParticipant" ADD CONSTRAINT "StudyParticipant_participantProfileId_fkey" FOREIGN KEY ("participantProfileId") REFERENCES "ParticipantProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyParticipant" ADD CONSTRAINT "StudyParticipant_studyId_fkey" FOREIGN KEY ("studyId") REFERENCES "Study"("id") ON DELETE CASCADE ON UPDATE CASCADE;
