-- AlterTable
ALTER TABLE "Invite" ADD COLUMN     "prefill" JSONB NOT NULL DEFAULT '{}';

-- AlterTable
ALTER TABLE "StudyParticipant" ADD COLUMN     "externalId" TEXT;
