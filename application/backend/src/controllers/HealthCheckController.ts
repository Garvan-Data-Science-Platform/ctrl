import { Workspace } from 'common/src/index'
import { Get, Route, Tags, Controller, SuccessResponse, Response } from 'tsoa'
import logger from 'common/src/logger'

const workspaces: Workspace[] = [
  { name: 'backend', version: '1.0.0' },
  { name: 'common', version: '1.0.0' },
  { name: 'frontend', version: '1.0.0' },
]

@Route('healthcheck')
@Tags('Healthcheck')
export class HealthCheckController extends Controller {
  /**
   * Health check to ensure server is up and running
   *
   * @summary Health Check
   */
  @Get('/')
  @SuccessResponse('200', 'OK')
  @Response('500', 'Internal Server Error')
  public async HealthCheck(): Promise<{ message: string }> {
    const response = { message: 'API is healthy' }
    logger.info(response)
    return response
  }

  /**
   * Get all Workspaces
   *
   * @summary Get all Workspaces
   */
  @Get('/workspaces')
  @SuccessResponse('200', 'OK')
  @Response('500', 'Internal Server Error')
  public async getAllWorkspaces(): Promise<{ message: string; data: Workspace[] }> {
    const response = { message: 'Getting workspaces', data: workspaces }
    logger.info(response)
    return response
  }
}
