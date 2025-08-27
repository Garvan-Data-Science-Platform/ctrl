export interface GetDeletedParticipantsResponse {
  data: {
    id: string
    profileId: number
    firstName: string
    lastName: string
    dob: Date
  }[]
}
