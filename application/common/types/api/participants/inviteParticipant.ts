import { Recipient } from '../../invite'

/**
 *
 * @example {
 *  "emails": ["john.doe@email.com", "jane@email.com"],
 *  "subjectText": "Invitation to Study",
 *  "explanatoryText": "You have been invited to participate in this Study. Please click this link to provide consent."
 * }
 */
export interface InviteParticipantsRequest {
  recipients: Recipient[]
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
