/**
 * @example {
 *  "firstName": "John",
 *  "lastName": "Doe",
 *  "email": "john.doe@email.com",
 *  "role": "User"
 * }
 */
export interface UpdateUserRequest {
  /**
   * @minLength 1
   */
  firstName?: string
  /**
   * @minLength 1
   */
  lastName?: string
  /**
   * @pattern ^(.+)@(.+)$ please provide valid email
   */
  email?: string
  role?: string
}

export interface UpdateUserResponse {
  message: string
}
