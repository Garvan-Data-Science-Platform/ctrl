import { User } from '@prisma/client'

export interface GetOrganisationUsers {
  Response: {
    message: string
    users: User[] | null
  }
}
