import { User } from '@prisma/client'

export interface GetAllUsers {
  Response: {
    message: string
    users: User[]
  }
}
