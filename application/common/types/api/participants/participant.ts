export interface Participant {
  id: number
  email?: string
  firstName: string
  lastName: string
  answers: ParticipantAnswerStatus[]
  lastUpdated?: string
}

export interface ParticipantAnswerStatus {
  surveyVersion: number
  participantId: number
  status: 'complete' | 'partially_complete' | 'incomplete'
}
