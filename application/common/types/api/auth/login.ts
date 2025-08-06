/**
 * @example {
 *  "email": "john.doe@email.com",
 *  "password": "Password123"
 * }
 */
export interface LoginRequest {
  /**
   * @pattern ^(.+)@(.+)$ Please provide valid email
   */
  email: string
  password: string
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

export interface LoginResponse {
  token?: string
  otp_token?: string
}
