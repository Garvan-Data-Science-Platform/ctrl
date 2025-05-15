-- AlterTable
ALTER TABLE "Study" ADD COLUMN     "inviteEmailSubject" TEXT NOT NULL DEFAULT 'Invitation to CTRL - Dynamic Consent Platform',
ADD COLUMN     "inviteEmailText" TEXT NOT NULL DEFAULT 'You have been invited to register with CTRL dynamic consent platform.';
