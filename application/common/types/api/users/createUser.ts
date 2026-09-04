import { Email, FirstName, LastName, RoleT } from '../../commonTypes'

export interface CreateUserRequest {
  firstName: FirstName
  lastName: LastName
  email: Email
  role: RoleT
}

export interface CreateUserResponse {
  id: number
}
