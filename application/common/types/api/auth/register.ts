/**
 * @example {
 *  "firstName": "John",
 *  "lastName": "Doe",
 *  "email": "john.doe@email.com",
 *  "password": "Password123",
 *  "role": "User",
 *    "dob": "1990-01-01",
 *    "participantID": "P12345",
 *    "mobile": "0412345678",
 *    "addressLine": "123 Main St",
 *    "suburb": "Sydney",
 *    "state": "NSW",
 *    "postcode": "2000",
 *    "preferredContact": "MOBILE"
 *  }
 * }
 */
export interface RegisterRequest {
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
   * @pattern ^(.+)@(.+)$ Please provide valid email
   */
  email: string
  /**
   * @minLength 8 Password must be at least 8 characters
   */
  password: string
  role: string
}

export interface RegisterResponse {
  message: string
  token: string
}
