import {
  AddressLine,
  DoB,
  Email,
  FirstName,
  LastName,
  MiddleName,
  Mobile,
  Postcode,
  Suburb,
} from '../../commonTypes'

import {
  AlternativeContact,
  ContactMethod,
  ParticipantType,
  StateTerritory,
} from './ParticipantProfile'

export interface FamilyMember {
  firstName: FirstName
  middleName?: MiddleName
  lastName: LastName
  dob: DoB
  id: number
  participantType: ParticipantType
}

export interface GetParticipantProfileResponse {
  data: {
    id: number
    firstName: FirstName
    middleName?: MiddleName
    lastName: LastName
    dob: DoB
    email?: Email
    mobile: Mobile
    addressLine?: AddressLine
    suburb?: Suburb
    state?: StateTerritory
    postcode?: Postcode
    preferredContact: ContactMethod
    participantType: ParticipantType
    nextOfKin?: AlternativeContact
    familyMembers: FamilyMember[]
    familyId: number
  }
}
