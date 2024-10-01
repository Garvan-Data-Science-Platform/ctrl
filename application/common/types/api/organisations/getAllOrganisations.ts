import { Organisation } from '@prisma/client'

export interface GetAllOrganisationsResponse {
  message: string
  organisations: Organisation[]
}
