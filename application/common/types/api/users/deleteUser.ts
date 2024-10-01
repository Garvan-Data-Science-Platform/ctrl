import { User } from '@prisma/client'

export interface DeleteUserResponse {
  message: string
  deletedUser: User | null
}
