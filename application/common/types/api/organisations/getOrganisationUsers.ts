import { User } from '@prisma/client'

export interface GetOrganisationUsersResponse {
  message: string
  users: User[]
}
