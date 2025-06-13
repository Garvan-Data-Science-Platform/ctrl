/*
  Warnings:

  - A unique constraint covering the columns `[studyId,email]` on the table `Invite` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Invite_email_key";

-- CreateIndex
CREATE UNIQUE INDEX "Invite_studyId_email_key" ON "Invite"("studyId", "email");
