import { AuditLog } from '@prisma/client'

export interface GetAuditLogsResponse {
  data: AuditLog[]
  total: number
}
