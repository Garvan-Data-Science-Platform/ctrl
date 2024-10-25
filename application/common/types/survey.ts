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

export enum SurveyElementType {
  CHOICES = 'question-choices',
  CHECKBOX = 'question-checkbox',
  SUBHEADING = 'subheading',
  VIDEO = 'video',
}

export interface SurveyElement {
  type: SurveyElementType
  data: SurveyQuestionCheckbox | SurveyQuestionChoices | SurveySubHeading | SurveyVideo
}

export interface SurveyStep {
  title: string
  text: string
  last_updated?: string
  elements: SurveyElement[]
  refusal_text: RefusalText
}

export interface UserSurveyStep {
  title: string
  text: string
  last_updated?: string
  current_step: number
  total_steps: number
  refusal_text: RefusalText
}

export interface SurveyStepBasic {
  title: string
  text: string
  last_updated?: string
  current_step: number
  total_steps: number
  questions: SurveyQuestion[]
  subheadings: SurveySubHeading[]
  refusal_text: RefusalText
}

export interface SurveyVersion {
  id?: number
  version_number?: number
  published_date?: string
  data: SurveyStep[]
}
