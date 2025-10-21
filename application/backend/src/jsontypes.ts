import { SurveyStep, UserSurveyStepState } from 'common/types/survey'
import { Prefill as P } from 'common/types/invite'

export {}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace PrismaJson {
    type SurveyVersionData = SurveyStep[]
    type SurveyAnswerData = UserSurveyStepState[]
    type Prefill = P
  }
}
