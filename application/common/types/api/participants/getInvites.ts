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
