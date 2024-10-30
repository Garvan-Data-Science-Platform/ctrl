-- CreateEnum
CREATE TYPE "StateTerritory" AS ENUM ('ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA');

-- CreateEnum
CREATE TYPE "ContactMethod" AS ENUM ('EMAIL', 'MOBILE', 'MAIL');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "middleName" TEXT;

-- CreateTable
CREATE TABLE "Profile" (
    "id" SERIAL NOT NULL,
    "dob" DATE NOT NULL,
    "participantID" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "addressLine" TEXT,
    "suburb" TEXT,
    "state" "StateTerritory",
    "postcode" TEXT,
    "preferredContact" "ContactMethod" NOT NULL,
    "userID" INTEGER NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userID_key" ON "Profile"("userID");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
