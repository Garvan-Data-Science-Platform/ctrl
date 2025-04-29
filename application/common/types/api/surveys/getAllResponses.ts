import { SurveyStep, UserSurveyStepState } from '../../survey'

export interface ParticipantData {
  profile: { firstName: string; lastName: string; dob: Date; familyId: number }
  answers: UserSurveyStepState[]
  versionId: number
}

export interface GetAllResponsesResponse {
  data: {
    surveyData: SurveyStep[]
    participants: ParticipantData[]
  }
}
