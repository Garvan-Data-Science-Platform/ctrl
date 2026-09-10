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

// Async lifecycle: the invite endpoint returns 202 after persisting rows in QUEUED and
// firing an unawaited drain. Send-success counts (emailsResent / failedEmails) cannot be
// known at response time and are dropped in favour of per-row status the admin polls for.
export interface InviteParticipantsResponse {
  resendEmailRequestCount: number
  newInvitesCount: number
  queuedCount: number
  alreadyAcceptedCount: number
}
