/*
  Warnings:

  - You are about to drop the column `userId` on the `SurveyAnswers` table. All the data in the column will be lost.
  - You are about to drop the column `versionId` on the `SurveyAnswers` table. All the data in the column will be lost.
  - Added the required column `participantId` to the `SurveyAnswers` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "SurveyAnswers" DROP CONSTRAINT "SurveyAnswers_userId_fkey";

-- DropForeignKey
ALTER TABLE "SurveyAnswers" DROP CONSTRAINT "SurveyAnswers_versionId_fkey";

-- AlterTable
ALTER TABLE "SurveyAnswers" DROP COLUMN "userId",
DROP COLUMN "versionId",
ADD COLUMN     "participantId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "SurveyAnswers" ADD CONSTRAINT "SurveyAnswers_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "SurveyParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
