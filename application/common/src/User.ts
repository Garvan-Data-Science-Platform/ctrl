import { User } from '@prisma/client'

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

export interface GetAllUsersResponse {
  message: string
  users: User[]
}

export interface GetUserByIdResponse {
  message: string
  user: User | null
}

export interface CreateUserResponse {
  message: string
  newUser: User | null
}

export interface UpdateUserResponse {
  message: string
  updatedUser: User | null
}

export interface DeleteUserResponse {
  message: string
  deletedUser: User | null
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

export interface OnBehalf {
  firstName: string
  middleName?: string
  lastName: string
  dob: string
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
  onBehalfOf?: OnBehalf
}
