import { GetParticipantProfileResponse } from './api/users'

/**
 * @pattern ^(.+)@(.+)$ Please provide valid email
 */
type Email = string

export interface Prefill {
  profile?: Partial<GetParticipantProfileResponse['data']>
  studyParticipant?: {
    externalId?: string
  }
}

export interface Recipient {
  email: Email
  prefill: Prefill
}
