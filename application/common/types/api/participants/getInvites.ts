import { Email, StudyName, StudyDescription } from '../../commonTypes'
import { InviteStatus } from './invite'
// import { FamilyMember } from '../users/getParticipantProfile'

export interface GetInvitesResponse {
  data: {
    id: string // String because this is a uuid TODO: add UUID type?
    email: Email
    studyId: number
    createdAt: string
    expiresAt: string
    sentAt?: string
    inviteStatus: InviteStatus
  }[]
}

export interface GetUserInvitesResponse {
  data: {
    invites: {
      id: string // String because this is a uuid TODO: add UUID type?
      email: Email
      studyId: number
      createdAt: string
      expiresAt: string
      sentAt?: string
      studyName: StudyName
      description?: StudyDescription
    }[]
    //    dependents: FamilyMember[]
  }
}
