import { OrganisationName } from '../../commonTypes'

export interface CreateOrganisationRequest {
  name: OrganisationName
}

export interface CreateOrganisationResponse {
  id: number
}
