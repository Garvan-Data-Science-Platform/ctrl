import { ExternalId } from '../../commonTypes'
import { UpdateProfileRequest } from '../users/updateProfile'

export type UpdateParticipantRequest = {
  externalId: ExternalId
  profile: UpdateProfileRequest
}
