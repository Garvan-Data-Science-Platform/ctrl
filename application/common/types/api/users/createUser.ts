import { User } from '@prisma/client'

export interface CreateUser {
  Request: {
    firstName: string
    lastName: string
    email: string
    role: string
  }
  Response: {
    message: string
    newUser: User | null
  }
}
