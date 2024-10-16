import type { OnBehalf, AlternativeContact } from '../users/getProfile'

export interface RegisterParticipantRequest {
  firstName: string
  lastName: string
  email: string
  password: string
  dob: string
  studyID: string
  isParentOrGuardian: boolean
  nextOfKin?: AlternativeContact
  onBehalfOf?: OnBehalf
}

export interface RegisterParticipantResponse {
  token: string
}
