import { GetParticipantProfileResponse } from '../users'

export interface Participant {
  email?: string
  firstName: string
  lastName: string
  profile: GetParticipantProfileResponse['data']
  answers: ParticipantAnswerStatus[]
  lastUpdated?: string
}

export interface ParticipantAnswerStatus {
  surveyVersion: number
  participantId: number
  status: 'complete' | 'partially_complete' | 'incomplete'
}
