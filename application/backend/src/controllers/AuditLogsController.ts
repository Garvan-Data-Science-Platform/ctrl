import { Controller, Get, Middlewares, Query, Security, Response, Route, Tags } from 'tsoa'
import prisma from '../PrismaClient'
import type { GetAuditLogsResponse } from 'common/types/api/audit-logs'
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
   * Get Audit Log entries (with pagination)
   *
   * @summary Get Audit Log entries (with pagination)
   */
  @Get('/')
  public async getAuditLogEntries(
    @Query() _start: number = 0,
    @Query() _end: number = 25,
    @Query() sortBy: string = 'timestamp',
    @Query() sortDirection: 'asc' | 'desc' = 'desc',
  ): Promise<GetAuditLogsResponse> {
    const skip = _start
    const take = _end - _start

    const [auditLogs, total] = await prisma.$transaction([
      this.auditLogRepo.findMany({
        skip,
        take,
        orderBy: { [sortBy]: sortDirection },
      }),
      this.auditLogRepo.count(),
    ])
    return {
      data: auditLogs,
      total,
    }
  }
}
