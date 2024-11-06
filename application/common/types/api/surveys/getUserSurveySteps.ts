import { SurveyStepStatus } from 'common/types/survey'

export interface GetUserSurveyStepsResponse {
  data: {
    title: string
    tooltip: string
    status: SurveyStepStatus
    last_updated?: string
  }[]
}

export interface GetUserSurveyStepsRequest {
  study_id?: string
}
