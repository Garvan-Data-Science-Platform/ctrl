import { User } from '@prisma/client'

export interface GetOrganisationUsersResponse {
  data: User[]
}
