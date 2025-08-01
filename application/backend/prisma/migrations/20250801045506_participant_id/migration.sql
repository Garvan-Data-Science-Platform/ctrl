-- AlterTable
ALTER TABLE "StudyParticipant" ADD COLUMN     "participantId" TEXT,
ADD COLUMN     "participantNumber" INTEGER NOT NULL DEFAULT 0;
