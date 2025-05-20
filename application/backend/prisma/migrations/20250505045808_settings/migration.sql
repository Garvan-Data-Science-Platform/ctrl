-- AlterTable
ALTER TABLE "Organisation" ADD COLUMN     "mailerHost" TEXT,
ADD COLUMN     "mailerPassword" TEXT,
ADD COLUMN     "mailerPort" INTEGER,
ADD COLUMN     "mailerUser" TEXT,
ADD COLUMN     "primaryColour" TEXT,
ADD COLUMN     "redcapToken" TEXT,
ADD COLUMN     "redcapURL" TEXT,
ADD COLUMN     "secondaryColour" TEXT;
