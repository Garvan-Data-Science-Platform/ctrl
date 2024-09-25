import { User } from '@prisma/client'

export interface GetUserById {
  Response: {
    message: string
    user: User | null
  }
}
