import { User } from '@prisma/client'

export interface GetAllUsersResponse {
  message: string
  users: User[]
}
