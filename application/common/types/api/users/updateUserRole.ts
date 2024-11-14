import type { Role } from '@prisma/client'

/**
 * @example {
 *  "newRole": "OperatorAdmin"
 * }
 */
export interface UpdateUserRoleRequest {
  newRole: Role
}

export interface UpdateUserRoleResponse {
  message: string
}
