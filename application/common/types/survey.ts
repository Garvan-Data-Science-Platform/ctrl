export interface DuoCode {
  code: string // List used codes?
  relatedAnswer: string | boolean
}

export interface SurveyQuestionCheckbox {
  text: string
  tooltip?: string
  required: boolean
  duoCodes?: DuoCode[]
}

export interface SurveyQuestionChoices {
  text: string
  tooltip?: string
  required: boolean
  choices: string[]
  duoCodes?: DuoCode[]
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

export type SurveyVersionStatus = 'PUBLISHED' | 'DRAFT'

export interface SurveyVersion {
  id?: number
  version_number?: number
  published_date?: string
  status: SurveyVersionStatus
  data: SurveyStep[]
}

export type SurveyStepStatus = 'completed' | 'review_required' | 'viewed'

export type SurveyStepAnswerArray = (string | boolean | null)[]

export interface UserSurveyStepState {
  status: SurveyStepStatus
  answers: SurveyStepAnswerArray
  last_updated?: string
}
