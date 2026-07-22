import { Role } from '@prisma/client'
/**
 * @example {
 *  "firstName": "John",
 *  "lastName": "Doe",
 *  "email": "john.doe@email.com",
 *  "password": "Supersecret123",
 *  "role": "OrganisationAdmin"
 * }
 */
export interface RegisterRequest {
  /**
   * @minLength 1
   */
  firstName: string
  /**
   * @minLength 1
   */
  middleName?: string
  /**
   * @minLength 1
   */
  lastName: string
  /**
   * @pattern ^(.+)@(.+)$ Please provide valid email
   */
  email: string
  /**
   * @minLength 14 Password must be at least 14 characters
   */
  password: string
  role: Role
}

export interface RegisterResponse {
  token: string
}
