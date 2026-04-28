import { AuditLog } from '@prisma/client'

export interface GetAuditLogsResponse {
  data: AuditLog[]
  total: number
}

export type AllowedAuditLogSortFields = keyof Omit<AuditLog, 'requestBody'>

const sortableFieldsMap: Record<AllowedAuditLogSortFields, true> = {
  id: true,
  resource: true,
  operation: true,
  success: true,
  timestamp: true,
  userId: true,
  meta: true,
}

export const AUDIT_LOG_SORTABLE_FIELDS = Object.keys(
  sortableFieldsMap,
) as AllowedAuditLogSortFields[]
