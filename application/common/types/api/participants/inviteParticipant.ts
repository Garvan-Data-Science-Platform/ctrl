import { InviteEmailText, InviteEmailSubject } from '../../commonTypes'
import { Recipient } from '../../invite'

export interface InviteParticipantsRequest {
  recipients: Recipient[]
  subjectText: InviteEmailSubject
  explanatoryText: InviteEmailText
}

export interface InviteParticipantsResponse {
  resendEmailRequestCount: number
  newInvitesCount: number
  emailsResentCount: number
  failedEmails: string[]
  failedEmailsCount: number
  alreadyAcceptedCount: number
}
