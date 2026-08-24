import {
  AddressLine,
  DoB,
  Email,
  ExternalId,
  FirstName,
  LastName,
  MiddleName,
  Mobile,
  Password,
  Postcode,
  Suburb,
} from '../../commonTypes'
import type {
  AlternativeContact,
  ContactMethod,
  StateTerritory,
  ParticipantType,
  OnBehalf,
} from '../users/ParticipantProfile'

export interface UpdateProfileRequest {
  firstName?: FirstName
  middleName?: MiddleName
  lastName?: LastName
  email?: Email
  mobile?: Mobile
  preferredContact?: ContactMethod
  addressLine?: AddressLine
  suburb?: Suburb
  postcode?: Postcode
  state?: StateTerritory
  password?: Password
  dob?: DoB
  participantType?: ParticipantType
  nextOfKin?: AlternativeContact
  /**
   * @maxItems 15
   */
  dependents?: OnBehalf[]
  /**
   * @maxLength 255
   */
  externalId?: ExternalId
}
