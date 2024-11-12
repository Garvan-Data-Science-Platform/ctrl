/*
 Warnings:
 
 - Added the required column `versionNumber` to the `SurveyVersion` table without a default value. This is not possible if the table is not empty.
 
 */
-- AlterTable
ALTER TABLE "SurveyVersion"
ADD COLUMN "versionNumber" INTEGER NOT NULL;
-- CreateTable
CREATE TABLE "SurveyAnswers" (
    "id" SERIAL NOT NULL,
    "versionId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SurveyAnswers_pkey" PRIMARY KEY ("id")
);
-- AddForeignKey
ALTER TABLE "SurveyAnswers"
ADD CONSTRAINT "SurveyAnswers_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "SurveyVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "SurveyAnswers"
ADD CONSTRAINT "SurveyAnswers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;