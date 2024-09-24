import { User, Organisation } from '@prisma/client'

export interface OrganisationCreationRequest {
  name: string
}

export interface OrganisationUpdateRequest {
  name?: string
}

export interface GetAllOrganisationsResponse {
  message: string
  organisations: Organisation[]
}

export interface GetOrganisationByIdResponse {
  message: string
  organisation: Organisation | null
}

export interface CreateOrganisationResponse {
  message: string
  newOrganisation: Organisation | null
}

export interface UpdateOrganisationResponse {
  message: string
  updatedOrganisation: Organisation | null
}

export interface DeleteOrganisationResponse {
  message: string
  deletedOrganisation: Organisation | null
}

export interface GetOrganisationUsersResponse {
  message: string
  users: User[] | null
}

export interface AddUserToOrganisationResponse {
  message: string
}

export interface RemoveUserFromOrganisationResponse {
  message: string
  user: User | null
}
