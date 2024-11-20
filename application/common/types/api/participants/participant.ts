export interface Participant {
  id: number
  email: string
  firstName: string
  lastName: string
  surveyVersion: number
  surveyStatus: 'complete' | 'partially_complete' | 'incomplete'
  lastUpdated: string
}
