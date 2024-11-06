export interface SurveyQuestionCheckbox {
  text: string
  tooltip?: string
  value: boolean
  required: boolean
}

export interface SurveyQuestionChoices {
  text: string
  tooltip?: string
  value: string
  required: boolean
  choices: string[]
}

export interface SurveySubHeading {
  text: string
}

export interface SurveyVideo {
  link: string
}

export interface RefusalText {
  title: string
  text: string
  button_text: string
}

export type SurveyElementType = 'question-choices' | 'question-checkbox' | 'subheading' | 'video'

export type SurveyElement =
  | {
      type: 'question-choices'
      data: SurveyQuestionChoices
    }
  | { type: 'question-checkbox'; data: SurveyQuestionCheckbox }
  | { type: 'video'; data: SurveyVideo }
  | { type: 'subheading'; data: SurveySubHeading }
  | { type: SurveyElementType; data: any }

export interface SurveyStep {
  title: string
  text: string
  last_updated?: string
  elements: SurveyElement[]
  //refusal_text: RefusalText
}

export interface UserSurveyStep {
  title: string
  text: string
  last_updated?: string
  current_step: number
  total_steps: number
  //refusal_text: RefusalText
}

export interface SurveyVersionBasic {
  id?: number
  version_number?: number
  published_date?: string
}

export interface SurveyVersion {
  id?: number
  version_number?: number
  published_date?: string
  data: SurveyStep[]
}
