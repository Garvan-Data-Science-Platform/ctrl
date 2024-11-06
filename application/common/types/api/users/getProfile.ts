import { AlternativeContact, ContactMethod, OnBehalf, StateTerritory } from './ParticipantProfile'

export interface GetUserProfileResponse {
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
