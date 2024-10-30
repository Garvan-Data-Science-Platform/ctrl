/**
 * @example {
 *  "email": "john.doe@email.com",
 *  "password": "newPassword123",
 * }
 */
export interface ResetPasswordRequest {
  /**
   * @pattern ^(.+)@(.+)$ please provide valid email
   */
  email: string
  /**
   * @minLength 8 Password must be at least 8 characters
   */
  password: string
}

export interface ResetPasswordResponse {
  message: string
}
