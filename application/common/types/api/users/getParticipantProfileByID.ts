import { ParticipantProfile } from '@prisma/client'

export interface GetUserProfileByIDResponse {
  message: string
  data: ParticipantProfile
}
