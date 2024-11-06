import type { SurveyStep } from '../../survey'

interface UserStepContext {
  current_step: number
  total_steps: number
}

export interface GetUserSurveyStepResponse {
  data: SurveyStep & UserStepContext
}

export interface GetUserSurveyStepRequest {
  study_id?: string
}
