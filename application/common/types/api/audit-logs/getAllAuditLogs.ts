import { AuditLog } from '@prisma/client'

export interface GetAllAuditLogsResponse {
  data: AuditLog[]
}
