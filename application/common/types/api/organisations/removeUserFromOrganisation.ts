import { User } from '@prisma/client'

export interface RemoveUserFromOrganisationResponse {
  message: string
  user: User | null
}
