-- AlterTable
ALTER TABLE "OnBehalf" ALTER COLUMN "dob" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "ParticipantProfile" ALTER COLUMN "dob" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "SurveyVersion" ALTER COLUMN "versionNumber" DROP DEFAULT;
DROP SEQUENCE "surveyversion_versionnumber_seq";
