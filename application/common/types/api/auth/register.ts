import { Email, FirstName, LastName, MiddleName, Password, RoleT } from '../../commonTypes'

export interface RegisterRequest {
  firstName: FirstName
  middleName?: MiddleName
  lastName: LastName
  email: Email
  password: Password
  role: RoleT
}

export interface RegisterResponse {
  token: string
}
