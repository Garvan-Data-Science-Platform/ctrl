import { User } from '@prisma/client'

export type UserResponse = Omit<User, 'password' | 'emailHash'>

export interface GetAllUsersResponse {
  data: UserResponse[]
}
