import {
  AlternativeContact,
  ContactMethod,
  ParticipantType,
  StateTerritory,
} from './ParticipantProfile'

export interface FamilyMember {
  firstName: string
  middleName?: string
  lastName: string
  dob: string
  id: number
  participantType: ParticipantType
}

export interface GetParticipantProfileResponse {
  data: {
    id: number
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
    nextOfKin?: AlternativeContact
    familyMembers: FamilyMember[]
    familyId: number
  }
}
