import { SurveyStep, UserSurveyStepState } from 'common/types/survey'

export {}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace PrismaJson {
    type SurveyVersionData = SurveyStep[]
    type SurveyAnswerData = UserSurveyStepState[]
  }
}
