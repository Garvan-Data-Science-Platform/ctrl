import { Recipient } from 'common/types/invite'

export interface UploadRedcapParticipantResponse {
  newParticipants: Recipient[]
  existingUsers: string[]
}
