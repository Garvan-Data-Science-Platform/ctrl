import {
  SurveyQuestionText,
  SurveyQuestionTooltip,
  SurveyStepDescription,
  SurveyStepTitle,
  SurveySubHeadingText,
  OptionalUrl,
} from './commonTypes'

export interface DuoCode {
  code: string // added via dropdown not form
  relatedAnswer: SurveyQuestionText | boolean
}

export interface SurveyQuestionCheckbox {
  text: SurveyQuestionText
  tooltip?: SurveyQuestionTooltip
  required?: boolean
  duoCodes?: DuoCode[]
  value?: boolean | null
}

export interface SurveyQuestionChoices {
  text: SurveyQuestionText
  tooltip?: SurveyQuestionTooltip
  required?: boolean
  choices: SurveyQuestionText[]
  duoCodes?: DuoCode[]
  value?: SurveyQuestionText | null
}

export interface SurveySubHeading {
  text: SurveySubHeadingText
}

export interface SurveyVideo {
  link?: OptionalUrl
}

export type SurveyElementType = 'question-choices' | 'question-checkbox' | 'subheading' | 'video'

/**
 * @discriminator type
 */
export type SurveyElement =
  | {
      type: 'question-choices'
      data: SurveyQuestionChoices
    }
  | { type: 'question-checkbox'; data: SurveyQuestionCheckbox }
  | { type: 'video'; data: SurveyVideo }
  | { type: 'subheading'; data: SurveySubHeading }

export interface SurveyStep {
  title: SurveyStepTitle
  text: SurveyStepDescription
  last_updated?: string // Added by frontend but not by form field
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

export type SurveyStepAnswerArray = (SurveyQuestionText | boolean | null)[]

export interface UserSurveyStepState {
  status: SurveyStepStatus
  answers: SurveyStepAnswerArray
  last_updated?: string
}
