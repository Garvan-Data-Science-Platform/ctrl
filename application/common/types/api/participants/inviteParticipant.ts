/**
 * @pattern ^(.+)@(.+)$ Please provide valid email
 */
type Email = string

export interface InviteParticipantsRequest {
  emails: Email[]
}

export interface InviteParticipantsResponse {
  resendEmailRequestCount: number
  newInvitesCount: number
  emailsToResendCount: number
  alreadyAcceptedCount: number
}
