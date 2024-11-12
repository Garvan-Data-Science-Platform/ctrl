import { SurveyStep, UserSurveyStepState } from 'common/types/survey'

export {}

declare global {
  namespace PrismaJson {
    type SurveyVersionData = SurveyStep[]
    type SurveyAnswerData = UserSurveyStepState[]
  }
}
