export interface RegisterRequest {
  firstName: string
  lastName: string
  email: string
  password: string
  role: string
}

export interface RegisterResponse {
  message: string
  token: string | null
  error: Error | null
}
