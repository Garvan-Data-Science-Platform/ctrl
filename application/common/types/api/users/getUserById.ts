import { User } from '@prisma/client'

export interface GetUserByIdResponse {
  data: User
}
