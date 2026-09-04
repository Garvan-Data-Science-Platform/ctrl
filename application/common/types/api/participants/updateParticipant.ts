import { UpdateProfileRequest } from '../users/updateProfile'

export type UpdateParticipantRequest = {
  externalId: string
  profile: UpdateProfileRequest
}
