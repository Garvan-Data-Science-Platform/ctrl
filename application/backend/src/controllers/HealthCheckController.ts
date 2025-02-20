import { Get, Route, Tags, Controller } from 'tsoa'
import { Workspace } from 'common/src/HealthCheck'
import logger from 'common/src/logger'

const workspaces: Workspace[] = [
  { name: 'backend', version: '1.0.0' },
  { name: 'common', version: '1.0.0' },
  { name: 'frontend', version: '1.0.0' },
]

@Route('/')
@Tags('Healthcheck')
export class HealthCheckController extends Controller {
  /**
   * Health check to ensure server is up and running
   *
   * @summary Health Check
   */
  @Get('/')
  public async HealthCheck() {
    return 'OK'
  }

  /**
   * Get all Workspaces
   *
   * @summary Get all Workspaces
   */
  @Get('/workspaces')
  public async getAllWorkspaces(): Promise<{ data: Workspace[] }> {
    const response = { data: workspaces }
    logger.info({ ...response })
    return response
  }
}
