import { Organisation } from '@prisma/client'

export interface GetAllOrganisationsResponse {
  data: Organisation[]
}
