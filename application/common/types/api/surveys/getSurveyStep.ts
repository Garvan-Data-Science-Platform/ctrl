export interface SurveyQuestion {
  text: string
  tooltip?: string
  checked: boolean
  required: boolean
}

interface RefusalText {
  title: string
  text: string
  button_text: string
}

export interface GetSurveyStepResponse {
  title: string
  text: string
  last_updated?: string
  current_step: number
  total_steps: number
  questions: SurveyQuestion[]
  refusal_text: RefusalText
}

export interface GetSurveyStepRequest {
  study_id?: string
}
