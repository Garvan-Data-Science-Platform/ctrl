/**
 * @example {
 *  "firstName": "John",
 *  "lastName": "Doe",
 *  "email": "john.doe@email.com",
 *  "password": "Password123",
 *  "role": "User"
 * }
 */
export interface CreateUserRequest {
  /**
   * @minLength 1
   */
  firstName: string
  /**
   * @minLength 1
   */
  lastName: string
  /**
   * @pattern ^(.+)@(.+)$ please provide valid email
   */
  email: string
  /**
   * @minLength 8
   */
  password: string
  role: string
}

export interface CreateUserResponse {
  message: string
}
