import { Organisation } from '@prisma/client'

export interface DeleteOrganisationResponse {
  message: string
  deletedOrganisation: Organisation | null
}
