import {
  SurveyQuestionText,
  SurveyQuestionTooltip,
  SurveyStepDescription,
  SurveyStepTitle,
  SurveySubHeadingText,
  Url,
} from './commonTypes'

export interface DuoCode {
  code: string // List used codes?
  relatedAnswer: string | boolean
}

export interface SurveyQuestionCheckbox {
  text: SurveyQuestionText
  tooltip?: SurveyQuestionTooltip
  required: boolean
  duoCodes?: DuoCode[]
}

export interface SurveyQuestionChoices {
  text: SurveyQuestionText
  tooltip?: SurveyQuestionTooltip
  required: boolean
  choices: string[]
  duoCodes?: DuoCode[]
}

export interface SurveySubHeading {
  text: SurveySubHeadingText
}

export interface SurveyVideo {
  link: Url
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
  title: SurveyStepTitle
  text: SurveyStepDescription
  last_updated?: string // TODO: Why is this a string? Should be omitted for the update survey response
  elements: SurveyElement[]
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
