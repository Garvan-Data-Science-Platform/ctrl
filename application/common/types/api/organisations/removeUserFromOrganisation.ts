import { User } from '@prisma/client'

export interface RemoveUserFromOrganisation {
  Response: {
    message: string
    user: User | null
  }
}
