import { Email, Password } from '../../commonTypes'

export interface GeneratePasswordResetLinkRequest {
  email: Email
}

export interface ResetPasswordRequest {
  newPassword: Password
  token: string
}
