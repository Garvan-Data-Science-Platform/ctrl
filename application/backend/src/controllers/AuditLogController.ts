import { Controller, Get, Middlewares, Security, Response, Route, Tags } from 'tsoa'
import prisma from '../PrismaClient'
import { AuditLog } from '@prisma/client'
import type { GetAllAuditLogsResponse } from 'common/types/api/audit-logs'
import { UnauthorizedErrorResponse } from 'common/types/api/errors'
import { auditLog } from '../middlewares/AuditLog'

@Route('audit-logs')
@Tags('AuditLogs')
@Response('500', 'Internal Server Error')
@Response<UnauthorizedErrorResponse>('401', 'Unauthorized')
@Security('jwt', ['OrganisationAdmin', 'StudyAdmin'])
@Middlewares(auditLog)
export class AuditLogController extends Controller {
  auditLogRepo = prisma.auditLog

  /**
   * Get all Audit Log entries
   *
   * @summary Get all Audit Log entries
   */
  @Get('/')
  public async getAuditLogEntries(): Promise<GetAllAuditLogsResponse> {
    const auditLogs: AuditLog[] = await this.auditLogRepo.findMany({})
    const responseData = { data: auditLogs }
    return responseData
  }
}
