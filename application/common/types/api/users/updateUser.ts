import { User } from '@prisma/client'

export interface UpdateUserRequest {
  firstName?: string
  lastName?: string
  email?: string
  role?: string
}

export interface UpdateUserResponse {
  message: string
  updatedUser: User | null
}
