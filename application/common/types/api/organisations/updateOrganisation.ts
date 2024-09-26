import { Organisation } from '@prisma/client'

export interface UpdateOrganisationRequest {
  name?: string
}

export interface UpdateOrganisationResponse {
  message: string
  updatedOrganisation: Organisation | null
}
