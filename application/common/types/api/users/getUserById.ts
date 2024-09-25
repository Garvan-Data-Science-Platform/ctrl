import { User } from '@prisma/client'

export interface GetUserByIdResponse {
  message: string
  user: User | null
}
