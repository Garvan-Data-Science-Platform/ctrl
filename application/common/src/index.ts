export type Workspace = {
  name: string
  version: string
}

export const backendPort = 5000

export interface UserCreationRequest {
  firstName: string
  lastName: string
  email: string
  role: string
}

export interface UserUpdateRequest {
  firstName?: string
  lastName?: string
  email?: string
  role?: string
}

export interface OrganisationCreationRequest {
  name: string
}

export interface OrganisationUpdateRequest {
  name?: string
}
