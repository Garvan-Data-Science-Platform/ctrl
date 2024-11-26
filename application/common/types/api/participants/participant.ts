export interface Participant {
  id: number
  email: string
  firstName: string
  lastName: string
  answers: ParticipantAnswer[]
  lastUpdated: string
}

export interface ParticipantAnswer {
  surveyVersion: number
  participantId: number
  status: 'complete' | 'partially_complete' | 'incomplete'
}
