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

export enum ContactMethod {
  mobile = 'mobile',
  email = 'email',
  mail = 'mail',
}

export enum StateTerritory {
  ACT = 'act',
  NSW = 'nsw',
  NT = 'nt',
  QLD = 'qld',
  SA = 'sa',
  TAS = 'tas',
  VIC = 'vic',
  WA = 'wa',
}

export interface AlternativeContact {
  firstName: string
  middleName?: string
  lastName: string
  phone: string
  email: string
}

export interface UserProfile {
  firstName: string
  middleName?: string
  lastName: string
  dob: string
  participantID: string
  email: string
  mobile: string
  addressLine?: string
  suburb?: string
  state?: StateTerritory
  postcode?: string
  preferredContact: ContactMethod
  isParentOrGuardian: boolean
  alternativeContact?: AlternativeContact
}
