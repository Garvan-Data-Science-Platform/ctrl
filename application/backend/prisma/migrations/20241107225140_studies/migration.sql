/*
  Warnings:

  - Made the column `addressLine` on table `ParticipantProfile` required. This step will fail if there are existing NULL values in that column.
  - Made the column `suburb` on table `ParticipantProfile` required. This step will fail if there are existing NULL values in that column.
  - Made the column `state` on table `ParticipantProfile` required. This step will fail if there are existing NULL values in that column.
  - Made the column `postcode` on table `ParticipantProfile` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "AlternativeContact_email_key";

-- AlterTable
ALTER TABLE "ParticipantProfile" ALTER COLUMN "addressLine" SET NOT NULL,
ALTER COLUMN "suburb" SET NOT NULL,
ALTER COLUMN "state" SET NOT NULL,
ALTER COLUMN "postcode" SET NOT NULL;

-- CreateTable
CREATE TABLE "OnBehalf" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dob" DATE NOT NULL,
    "participantProfileId" INTEGER NOT NULL,

    CONSTRAINT "OnBehalf_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Study" (
    "id" SERIAL NOT NULL,

    CONSTRAINT "Study_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyParticipant" (
    "id" SERIAL NOT NULL,
    "studyId" INTEGER NOT NULL DEFAULT 1,
    "versionId" INTEGER NOT NULL,
    "profileId" INTEGER NOT NULL,

    CONSTRAINT "StudyParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OnBehalf_participantProfileId_key" ON "OnBehalf"("participantProfileId");

-- AddForeignKey
ALTER TABLE "OnBehalf" ADD CONSTRAINT "OnBehalf_participantProfileId_fkey" FOREIGN KEY ("participantProfileId") REFERENCES "ParticipantProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyParticipant" ADD CONSTRAINT "StudyParticipant_studyId_fkey" FOREIGN KEY ("studyId") REFERENCES "Study"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyParticipant" ADD CONSTRAINT "StudyParticipant_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "SurveyVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyParticipant" ADD CONSTRAINT "StudyParticipant_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "ParticipantProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
