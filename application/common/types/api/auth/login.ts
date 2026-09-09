import { Email, Password, RoleT } from '../../commonTypes'

export interface LoginRequest {
  email: Email
  password: Password
}

export interface OTPLoginRequest {
  otp_token: string
  otp_code: string
}

export interface OIDCLoginRequest {
  code: string
  provider: string
  redirect_uri: string
}

export interface LoginSuccessResponse {
  token: string
  id: number
  role: RoleT
}

export interface LoginChallengeResponse {
  otp_token: string
}

export type LoginResponse = LoginSuccessResponse | LoginChallengeResponse
