/**
 * @example {
 *  "email": "john.doe@email.com",
 *  "password": "Password123"
 * }
 */
export interface RegisterSetupRequest {
  /**
   * @pattern ^(.+)@(.+)$ Please provide valid email
   */
  email: string
  /**
   * @minLength 14 Password must be at least 14 characters
   */
  password: string
}
