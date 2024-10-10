export interface SurveyQuestion {
  text: string
  tooltip?: string
  value: boolean | string
  required: boolean
  type: 'checkbox' | 'choices'
  choices?: string[]
}

export interface SurveySubHeading {
  text: string
  position: number
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
  subheadings: SurveySubHeading[]
  refusal_text: RefusalText
}

export interface GetSurveyStepRequest {
  study_id?: string
}
