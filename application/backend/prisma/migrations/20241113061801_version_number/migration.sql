-- DropForeignKey
ALTER TABLE "StudyParticipant" DROP CONSTRAINT "StudyParticipant_profileId_fkey";

-- DropForeignKey
ALTER TABLE "StudyParticipant" DROP CONSTRAINT "StudyParticipant_studyId_fkey";

-- DropForeignKey
ALTER TABLE "StudyParticipant" DROP CONSTRAINT "StudyParticipant_versionId_fkey";

-- DropForeignKey
ALTER TABLE "SurveyAnswers" DROP CONSTRAINT "SurveyAnswers_userId_fkey";

-- DropForeignKey
ALTER TABLE "SurveyAnswers" DROP CONSTRAINT "SurveyAnswers_versionId_fkey";

-- AlterTable
ALTER TABLE "SurveyVersion" ALTER COLUMN "versionNumber" DROP DEFAULT;
DROP SEQUENCE "surveyversion_versionnumber_seq";

-- AddForeignKey
ALTER TABLE "SurveyAnswers" ADD CONSTRAINT "SurveyAnswers_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "SurveyVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyAnswers" ADD CONSTRAINT "SurveyAnswers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyParticipant" ADD CONSTRAINT "StudyParticipant_studyId_fkey" FOREIGN KEY ("studyId") REFERENCES "Study"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyParticipant" ADD CONSTRAINT "StudyParticipant_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "SurveyVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyParticipant" ADD CONSTRAINT "StudyParticipant_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "ParticipantProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
