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
 *  "newPassword": "Newsupersecret123",
 *  "token": "1063e00e4a273e698577"
 * }
 */
export interface ResetPasswordRequest {
  /**
   * @minLength 14 Password must be at least 14 characters
   */
  newPassword: string
  token: string
}
