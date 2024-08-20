export interface User {
  firstName: string
  lastName: string
  email: string
  role: string
  organisations: string[] // TODO: Change type to Organisation once implemented
  createdAt: Date
  updatedAt: Date
}
