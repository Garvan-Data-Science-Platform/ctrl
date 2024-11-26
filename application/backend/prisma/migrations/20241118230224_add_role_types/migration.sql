-- CreateEnum
CREATE TYPE "Role" AS ENUM (
  'OperatorAdmin',
  'Participant',
  'OrganisationAdmin'
);
-- AlterTable
ALTER TABLE "User" DROP COLUMN "role",
  ADD COLUMN "role" "Role" NOT NULL DEFAULT 'Participant';