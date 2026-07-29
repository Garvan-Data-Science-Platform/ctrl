import { GetParticipantProfileResponse } from './api/users'
import { Email, ExternalId } from './commonTypes'

export interface Prefill {
  profile?: Partial<GetParticipantProfileResponse['data']>
  studyParticipant?: {
    externalId?: ExternalId
  }
}

export interface Recipient {
  email: Email
  prefill: Prefill
}
