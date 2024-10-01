import { User } from '@prisma/client'

export interface CreateUserRequest {
  firstName: string
  lastName: string
  email: string
  role: string
}

export interface CreateUserResponse {
  message: string
  newUser: User | null
}
