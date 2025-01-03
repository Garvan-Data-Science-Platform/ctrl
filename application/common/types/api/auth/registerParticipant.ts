import type {
  AlternativeContact,
  ContactMethod,
  StateTerritory,
  ParticipantType,
  OnBehalf,
} from '../users/ParticipantProfile'

/**
 * @example {
 *  "firstName": "John",
 *  "middleName": "James",
 *  "lastName": "Doe",
 *  "email": "john.doe@email.com",
 *  "password": "Password123",
 *  "dob": "2000-05-21",
 *  "mobile": "0412341234",
 *  "addressLine": "123 Sydney Street",
 *  "suburb": "Sydney",
 *  "postcode": "2000",
 *  "state": "NSW",
 *  "participantType": "STANDARD",
 *  "preferredContact": "MOBILE",
 *  "nextOfKin": {
 *    "firstName": "Jeremy",
 *    "middleName": "Jimmy",
 *    "lastName": "Doe",
 *    "mobile": "0412341432",
 *    "email": "jeremydoe@email.com"
 *  },
 *  "dependents": []
 * }
 */
export interface RegisterParticipantRequest {
  /**
   * @minLength 1
   */
  firstName: string
  /**
   * @minLength 1
   */
  middleName?: string
  /**
   * @minLength 1
   */
  lastName: string
  /**
   * @pattern ^(.+)@(.+)$ please provide valid email
   */
  email: string
  /**
   * @pattern ^(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$ please provide valid phone number
   */
  mobile: string
  preferredContact: ContactMethod
  /**
   * @minLength 1
   */
  addressLine: string
  /**
   * @minLength 1
   */
  suburb: string
  /**
   * @minLength 1
   */
  postcode: string
  state: StateTerritory
  /**
   * @minLength 8 Password must be at least 8 characters
   */
  password: string
  /**
   * @isDate Date of birth must be of date format
   */
  dob: string
  /**
   * @isBool
   */
  participantType: ParticipantType
  nextOfKin: AlternativeContact
  dependents: OnBehalf[]
}

export interface RegisterParticipantResponse {
  id: number
  token: string
}
