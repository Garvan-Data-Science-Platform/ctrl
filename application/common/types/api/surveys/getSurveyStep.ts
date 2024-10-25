import type { SurveyStep } from '../../survey'

export interface GetSurveyStepResponse {
  data: SurveyStep
}

export interface GetSurveyStepRequest {
  study_id?: string
}
