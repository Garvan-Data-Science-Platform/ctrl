-- AlterEnum
ALTER TYPE "InviteStatus" ADD VALUE 'FAILED_TO_SEND';

-- AlterTable
ALTER TABLE "Invite" ADD COLUMN     "sentAt" TIMESTAMP(3);
