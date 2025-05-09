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
  subjectText: string
  explanatoryText: string
}

export interface InviteParticipantsResponse {
  resendEmailRequestCount: number
  newInvitesCount: number
  emailsResentCount: number
  failedEmails: string[]
  failedEmailsCount: number
  alreadyAcceptedCount: number
}
