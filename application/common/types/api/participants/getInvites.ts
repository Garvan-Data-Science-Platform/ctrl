import { InviteStatus } from './invite'
import { FamilyMember } from '../users/getParticipantProfile'

export interface GetInvitesResponse {
  data: {
    id: string // String because this is a uuid
    email: string
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
      id: string // String because this is a uuid
      email: string
      studyId: number
      createdAt: string
      expiresAt: string
      sentAt?: string
      studyName: string // may be other fields here in future
    }[]
    dependents: FamilyMember[]
  }
}
