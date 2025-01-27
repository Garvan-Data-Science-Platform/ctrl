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

export interface NewPasswordRequest {
  /**
   * @minLength 8 Password must be at least 8 characters
   */
  newPassword: string
  /**
   * @minLength 8 Password must be at least 8 characters
   */
  token: string
}

export interface ResetPasswordResponse {
  message: string
}
