import { Email, FirstName, LastName, RoleT } from '../../commonTypes'

export interface UpdateUserRequest {
  firstName?: FirstName
  lastName?: LastName
  email?: Email
  role?: RoleT
}
