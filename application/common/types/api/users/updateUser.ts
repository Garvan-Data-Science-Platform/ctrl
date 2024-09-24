import { User } from '@prisma/client'

export interface UpdateUser {
  Request: {
    firstName?: string
    lastName?: string
    email?: string
    role?: string
  }
  Response: {
    message: string
    updatedUser: User | null
  }
}
