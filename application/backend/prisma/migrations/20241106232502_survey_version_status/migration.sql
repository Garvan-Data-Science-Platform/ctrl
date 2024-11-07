-- CreateEnum
CREATE TYPE "SurveyVersionStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- AlterTable
ALTER TABLE "SurveyVersion" ADD COLUMN     "status" "SurveyVersionStatus" NOT NULL DEFAULT 'DRAFT';
