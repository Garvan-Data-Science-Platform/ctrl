import type { OnBehalf, AlternativeContact } from '../users/getProfile'

/**
 * @example {
 *  "firstName": "John",
 *  "lastName": "Doe",
 *  "email": "john.doe@email.com",
 *  "password": "Password123",
 *  "dob": "",
 *  "studyID": "",
 *  "isParentOrGuardian": false,
 *  "nextOfKin": {
 *    "firstName": "Sonofjohn",
 *    "lastName": "Doe",
 *    "email": "mysons@email.com",
 *  },
 *  "onBehalfOf": {
 *    "firstName": "John",
 *    "lastName": "Doe",
 *    "dob": ""
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
   * @isBool
   */
  isParentOrGuardian: boolean
  nextOfKin?: AlternativeContact
  onBehalfOf?: OnBehalf
}

export interface RegisterParticipantResponse {
  token: string
}
