/**
 * @example {
 *  "email": "john.doe@email.com",
 *  "password": "Password123",
 * }
 */
export interface RegisterSetupRequest {
  /**
   * @pattern ^(.+)@(.+)$ Please provide valid email
   */
  email: string
  /**
   * @minLength 8 Password must be at least 8 characters
   */
  password: string
}
