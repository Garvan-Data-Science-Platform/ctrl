import { ParticipantProfile } from '@prisma/client'

export interface GetParticipantProfileByIDResponse {
  message: string
  data: ParticipantProfile & {
    user: {
      firstName: string
      middleName?: string
      lastName: string
      email: string
    }
  }
}
