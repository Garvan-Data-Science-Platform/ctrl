import {
  AlternativeContact,
  ContactMethod,
  OnBehalf,
  ParticipantType,
  StateTerritory,
} from './ParticipantProfile'

export interface FamilyMember {
  firstName: string
  lastName: string
  participantType: ParticipantType
}

export interface GetParticipantProfileResponse {
  message: string
  data: {
    firstName: string
    middleName?: string
    lastName: string
    dob: string
    email?: string
    mobile: string
    addressLine?: string
    suburb?: string
    state?: StateTerritory
    postcode?: string
    preferredContact: ContactMethod
    participantType: ParticipantType
    alternativeContact?: AlternativeContact
    familyMembers: FamilyMember[]
  }
}
