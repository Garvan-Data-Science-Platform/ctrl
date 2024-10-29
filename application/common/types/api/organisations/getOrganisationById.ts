import { Organisation } from '@prisma/client'

export interface GetOrganisationByIdResponse {
  message: string
  organisation: Organisation
}
