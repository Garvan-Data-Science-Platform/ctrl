import type { AlternativeContact } from './ParticipantProfile'

export interface UpdateProfileRequest {
  firstName: string
  lastName: string
  email: string
  password: string
  dob: string
  nextOfKin?: AlternativeContact
}

export interface UpdateProfileResponse {
  message: string
}
