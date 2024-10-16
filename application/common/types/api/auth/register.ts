/**
 * @example {
 *  "firstName": "John",
 *  "lastName": "Doe",
 *  "email": "john.doe@email.com",
 *  "password": "Password123",
 *  "role": "User"
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
  lastName: string
  /**
   * @pattern ^(.+)@(.+)$ please provide valid email
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
  token: string | null
}
