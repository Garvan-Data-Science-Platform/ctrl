import type { OnBehalf, AlternativeContact, ContactMethod } from '../users/ParticipantProfile'

/**
 * @example {
 *  "firstName": "John",
 *  "middleName": "James",
 *  "lastName": "Doe",
 *  "email": "john.doe@email.com",
 *  "password": "Password123",
 *  "dob": "2000-05-21",
 *  "participantID": "P12345678",
 *  "studyID": "S12345678",
 *  "mobile": "0412341234",
 *  "addressLine": "123 Sydney Street, Sydney NSW 2000",
 *  "isParentOrGuardian": false,
 *  "preferredContact": "MOBILE",
 *  "nextOfKin": {
 *    "firstName": "Jeremy",
 *    "middleName": "Jimmy",
 *    "lastName": "Doe",
 *    "mobile": "0412341432",
 *    "email": "jeremydoe@email.com",
 *    "relationship": "PARENT"
 *  },
 *  "onBehalfOf": {
 *    "firstName": "Timothy",
 *    "lastName": "Doe",
 *    "dob": "1963-05-27"
 *  }
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
  addressLine: string
  /**
   * @minLength 8 Password must be at least 8 characters
   */
  password: string
  /**
   * @isDate Date of birth must be of date format
   */
  dob: string
  /**
   * @minLength 1
   */
  studyID: string
  /**
   * @minLength 1
   */
  participantID: string
  /**
   * @isBool
   */
  isParentOrGuardian: boolean
  nextOfKin?: AlternativeContact
  onBehalfOf?: OnBehalf
}

export interface RegisterParticipantResponse {
  message: string
  token: string
}
