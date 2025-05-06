import { Study } from '@prisma/client'

export interface GetAllStudiesResponse {
  data: Study[]
}
