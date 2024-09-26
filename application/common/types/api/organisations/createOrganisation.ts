import { Organisation } from '@prisma/client'

export interface CreateOrganisationRequest {
  name: string
}

export interface CreateOrganisationResponse {
  message: string
  newOrganisation: Organisation | null
}
