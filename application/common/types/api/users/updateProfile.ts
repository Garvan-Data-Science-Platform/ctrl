import { RegisterParticipantRequest } from '../auth'

/**
 * @example {
 *  "firstName": "John",
 *  "middleName": "James",
 *  "lastName": "Doe",
 *  "email": "john.doe@email.com",
 *  "password": "Supersecret123",
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
 *  }
 * }
 */
export type UpdateProfileRequest = Partial<RegisterParticipantRequest>
