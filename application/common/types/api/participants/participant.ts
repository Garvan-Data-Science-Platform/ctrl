import { Email, FirstName, LastName } from '../../commonTypes'
import { GetParticipantProfileResponse } from '../users'

export interface Participant {
  id: number
  participantId: string
  externalId?: string
  email?: Email
  firstName: FirstName
  lastName: LastName
  familyId: number
  answers: ParticipantAnswerStatus[]
  lastUpdated?: string
}

export type ParticipantWithProfile = Participant & {
  profile: GetParticipantProfileResponse['data']
}

export interface ParticipantAnswerStatus {
  surveyVersionNumber: number
  participantId: number
  status: 'complete' | 'partially_complete' | 'incomplete'
}
