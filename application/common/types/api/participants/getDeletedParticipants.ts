import { FirstName, LastName, DoB, StudyName } from '../../commonTypes'

export interface GetDeletedParticipantsResponse {
  data: {
    id: string
    profileId: number
    firstName: FirstName
    lastName: LastName
    dob: DoB
    study: StudyName
    studyId: number
  }[]
}
