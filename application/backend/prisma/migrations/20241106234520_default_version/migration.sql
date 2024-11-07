-- AlterTable
CREATE SEQUENCE surveyversion_versionnumber_seq;
ALTER TABLE "SurveyVersion" ALTER COLUMN "versionNumber" SET DEFAULT nextval('surveyversion_versionnumber_seq');
ALTER SEQUENCE surveyversion_versionnumber_seq OWNED BY "SurveyVersion"."versionNumber";
