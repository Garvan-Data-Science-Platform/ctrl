import {
  AddressLine,
  DoB,
  Email,
  ExternalId,
  FirstName,
  LastName,
  MiddleName,
  Mobile,
  Postcode,
  Suburb,
} from './commonTypes'
import { AlternativeContact, ContactMethod, StateTerritory } from './api/users/ParticipantProfile'

export interface ProfilePrefill {
  firstName?: FirstName
  middleName?: MiddleName
  lastName?: LastName
  dob?: DoB
  mobile?: Mobile
  addressLine?: AddressLine
  suburb?: Suburb
  state?: StateTerritory
  postcode?: Postcode
  preferredContact?: ContactMethod
  nextOfKin?: AlternativeContact
  // No FamilyMember or family id as I can't see how
  // an external system would know the correct IDs.
  // Ditto with ParticipantType
}

export interface Prefill {
  profile?: ProfilePrefill
  studyParticipant?: {
    externalId?: ExternalId
  }
}

export interface Recipient {
  email: Email
  prefill: Prefill
}
