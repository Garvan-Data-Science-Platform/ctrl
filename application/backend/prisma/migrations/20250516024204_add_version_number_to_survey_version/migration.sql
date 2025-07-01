/*
  Warnings:

  - A unique constraint covering the columns `[studyId,versionNumber]` on the table `SurveyVersion` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `versionNumber` to the `SurveyVersion` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SurveyVersion" ADD COLUMN     "versionNumber" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "SurveyVersion_studyId_versionNumber_key" ON "SurveyVersion"("studyId", "versionNumber");
