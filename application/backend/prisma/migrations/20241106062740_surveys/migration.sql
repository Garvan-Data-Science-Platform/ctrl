/*
  Warnings:

  - Added the required column `versionNumber` to the `SurveyVersion` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RelationshipType" AS ENUM ('PARENT', 'GUARDIAN', 'CHILD', 'OTHER');

-- CreateEnum
CREATE TYPE "StateTerritory" AS ENUM ('ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA');

-- CreateEnum
CREATE TYPE "ContactMethod" AS ENUM ('EMAIL', 'MOBILE', 'MAIL');

-- AlterTable
ALTER TABLE "SurveyVersion" ADD COLUMN     "versionNumber" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "middleName" TEXT;

-- CreateTable
CREATE TABLE "ParticipantProfile" (
    "id" SERIAL NOT NULL,
    "dob" DATE NOT NULL,
    "participantID" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "addressLine" TEXT,
    "suburb" TEXT,
    "state" "StateTerritory",
    "postcode" TEXT,
    "isParentOrGuardian" BOOLEAN NOT NULL,
    "preferredContact" "ContactMethod" NOT NULL,
    "userID" INTEGER NOT NULL,

    CONSTRAINT "ParticipantProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlternativeContact" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT NOT NULL,
    "mobile" TEXT,
    "email" TEXT NOT NULL,
    "relationship" "RelationshipType" NOT NULL,
    "participantProfileId" INTEGER NOT NULL,

    CONSTRAINT "AlternativeContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurveyAnswers" (
    "id" SERIAL NOT NULL,
    "versionId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SurveyAnswers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ParticipantProfile_userID_key" ON "ParticipantProfile"("userID");

-- CreateIndex
CREATE UNIQUE INDEX "AlternativeContact_email_key" ON "AlternativeContact"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AlternativeContact_participantProfileId_key" ON "AlternativeContact"("participantProfileId");

-- AddForeignKey
ALTER TABLE "ParticipantProfile" ADD CONSTRAINT "ParticipantProfile_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlternativeContact" ADD CONSTRAINT "AlternativeContact_participantProfileId_fkey" FOREIGN KEY ("participantProfileId") REFERENCES "ParticipantProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyAnswers" ADD CONSTRAINT "SurveyAnswers_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "SurveyVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyAnswers" ADD CONSTRAINT "SurveyAnswers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
