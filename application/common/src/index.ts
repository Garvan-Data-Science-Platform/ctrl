export type Workspace = {
  name: string
  version: string
}

export const backendPort = 5000

export interface UserCreationRequest {
  firstName: string
  email: string
  role: string
  organisations: string[]
}

export interface UserUpdateRequest {
  firstName?: string
  email?: string
  role?: string
  organisations?: string[]
}
