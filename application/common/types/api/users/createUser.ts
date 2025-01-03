import { Role } from '@prisma/client'

/**
 * @example {
 *  "firstName": "John",
 *  "lastName": "Doe",
 *  "email": "john.doe@email.com",
 *  "password": "Password123",
 *  "role": "Participant"
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
  role: Role
}

export interface CreateUserResponse {
  id: number
}
