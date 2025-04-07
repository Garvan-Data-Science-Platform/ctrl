/**
 * @pattern ^(.+)@(.+)$ Please provide valid email
 */
type Email = string

/**
 *
 * @example {
 *  "emails": ["john.doe@email.com", "jane@email.com"]
 * }
 */
export interface InviteParticipantsRequest {
  emails: Email[]
}

export interface InviteParticipantsResponse {
  resendEmailRequestCount: number
  newInvitesCount: number
  emailsToResendCount: number
  alreadyAcceptedCount: number
}
