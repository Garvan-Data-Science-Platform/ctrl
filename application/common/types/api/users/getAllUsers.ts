import { UserT } from '../../commonTypes'

export type UserResponse = Omit<UserT, 'password' | 'emailHash'>

export interface GetAllUsersResponse {
  data: UserResponse[]
}
