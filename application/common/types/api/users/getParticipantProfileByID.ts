import { ParticipantProfile } from '@prisma/client'

export interface GetParticipantProfileByIDResponse {
  message: string
  data: ParticipantProfile
}
