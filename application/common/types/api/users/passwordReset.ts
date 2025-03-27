/**
 * @example {
 *  "email": "john.doe@email.com"
 * }
 */
export interface GeneratePasswordResetLinkRequest {
  /**
   * @pattern ^(.+)@(.+)$ please provide valid email
   */
  email: string
}

/**
 * @example {
 *  "newPassword": "newPassword123",
 *  "token": "1063e00e4a273e698577"
 * }
 */
export interface ResetPasswordRequest {
  /**
   * @minLength 8 Password must be at least 8 characters
   */
  newPassword: string
  token: string
}
