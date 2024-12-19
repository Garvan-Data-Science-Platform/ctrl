/**
 * @example {
 *  "email": "john.doe@email.com",
 * }
 */
export interface GeneratePasswordResetLinkRequest {
  email: string
}

export interface GeneratePasswordResetLinkResponse {
  message: string
}

/**
 * @example {
 *  "token": "some-valid-token",
 *  "newPassword": "NewPassword123"
 * }
 */
export interface ResetPasswordRequest {
  token: string
  newPassword: string
}

export interface ResetPasswordResponse {
  message: string
}
