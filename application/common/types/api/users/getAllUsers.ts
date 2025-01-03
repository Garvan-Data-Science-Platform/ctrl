import { User } from '@prisma/client'

export interface GetAllUsersResponse {
  data: User[]
}
