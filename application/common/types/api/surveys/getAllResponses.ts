import { SurveyStep, UserSurveyStepState } from '../../survey'

export interface ParticipantData {
  profile: { firstName: string; lastName: string; dob: string; familyId: number }
  answers: UserSurveyStepState[]
  versionId: number
  participantId: string
}

export interface GetAllResponsesResponse {
  data: {
    surveyData: SurveyStep[]
    participants: ParticipantData[]
  }
}
