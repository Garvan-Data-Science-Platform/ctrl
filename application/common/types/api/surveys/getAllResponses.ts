import { DoB, FirstName, LastName } from '../../commonTypes'
import { SurveyStep, UserSurveyStepState } from '../../survey'

export interface ParticipantData {
  profile: { firstName: FirstName; lastName: LastName; dob: DoB; familyId: number }
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
