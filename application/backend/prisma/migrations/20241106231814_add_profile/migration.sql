-- CreateEnum
CREATE TYPE "RelationshipType" AS ENUM ('PARENT', 'GUARDIAN', 'CHILD', 'OTHER');

-- CreateEnum
CREATE TYPE "StateTerritory" AS ENUM ('ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA');

-- CreateEnum
CREATE TYPE "ContactMethod" AS ENUM ('EMAIL', 'MOBILE', 'MAIL');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "middleName" TEXT;

-- CreateTable
CREATE TABLE "ParticipantProfile" (
    "id" SERIAL NOT NULL,
    "dob" DATE NOT NULL,
    "participantID" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "addressLine" TEXT NOT NULL,
    "suburb" TEXT NOT NULL,
    "state" "StateTerritory" NOT NULL,
    "postcode" TEXT NOT NULL,
    "isParentOrGuardian" BOOLEAN NOT NULL,
    "preferredContact" "ContactMethod" NOT NULL,
    "userID" INTEGER NOT NULL,

    CONSTRAINT "ParticipantProfile_pkey" PRIMARY KEY ("id")
);

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

-- CreateIndex
CREATE UNIQUE INDEX "ParticipantProfile_userID_key" ON "ParticipantProfile"("userID");

-- CreateIndex
CREATE UNIQUE INDEX "OnBehalf_participantProfileId_key" ON "OnBehalf"("participantProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "AlternativeContact_participantProfileId_key" ON "AlternativeContact"("participantProfileId");

-- AddForeignKey
ALTER TABLE "ParticipantProfile" ADD CONSTRAINT "ParticipantProfile_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnBehalf" ADD CONSTRAINT "OnBehalf_participantProfileId_fkey" FOREIGN KEY ("participantProfileId") REFERENCES "ParticipantProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlternativeContact" ADD CONSTRAINT "AlternativeContact_participantProfileId_fkey" FOREIGN KEY ("participantProfileId") REFERENCES "ParticipantProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
