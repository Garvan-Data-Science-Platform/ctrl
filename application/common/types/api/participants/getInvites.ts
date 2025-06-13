import { InviteStatus } from './invite'

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
    id: string // String because this is a uuid
    email: string
    studyId: number
    createdAt: string
    expiresAt: string
    sentAt?: string
    studyName: string // may be other fields here in future
  }[]
}
