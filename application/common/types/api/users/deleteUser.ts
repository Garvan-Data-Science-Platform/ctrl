import { User } from '@prisma/client'

export interface DeleteUser {
  Response: {
    message: string
    deletedUser: User | null
  }
}
