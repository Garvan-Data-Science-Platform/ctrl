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
  /**
   * @minLength 8 Password must be at least 8 characters
   */
  password: string
}

export interface OIDCLoginRequest {
  code: string
  provider: string
  redirect_uri: string
}

export interface LoginResponse {
  token: string
}
