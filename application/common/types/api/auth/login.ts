export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  message: string
  token: string | null
}
