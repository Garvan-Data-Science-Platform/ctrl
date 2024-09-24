import { User } from '@prisma/client'

export interface UserCreationRequest {
  firstName: string
  lastName: string
  email: string
  role: string
}

export interface GetAllUsersResponse {
  message: string
  users: User[]
}

export interface CreateUserResponse {
  message: string
  newUser: User | null
}

export interface DeleteUserResponse {
  message: string
  deletedUser: User | null
}
