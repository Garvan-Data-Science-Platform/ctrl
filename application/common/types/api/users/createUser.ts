import { Role } from '@prisma/client'

/**
 * @example {
 *  "firstName": "John",
 *  "lastName": "Doe",
 *  "email": "john.doe@email.com",
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
  role: Role
}

export interface CreateUserResponse {
  id: number
}
