import type { OnBehalf, AlternativeContact } from './ParticipantProfile'

export interface UpdateProfileRequest {
  firstName: string
  lastName: string
  email: string
  password: string
  dob: string
  studyId: string
  isParentOrGuardian: boolean
  nextOfKin?: AlternativeContact
  onBehalfOf?: OnBehalf
}

export interface UpdateProfileResponse {
  message: string
}
