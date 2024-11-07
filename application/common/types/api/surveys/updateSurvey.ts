import { SurveyStep } from '../../survey'

export interface UpdateSurveyRequest {
  data: SurveyStep[]
}

export interface UpdateSurveyResponse {
  message: string
}
