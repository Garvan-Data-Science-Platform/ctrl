import { InviteStatus } from './invite'

export interface GetInvitesResponse {
  data: {
    id: number
    email: string
    createdAt: string
    expiresAt: string
    inviteStatus: InviteStatus
  }[]
}
