import { Get, Route, Tags, Controller, NoSecurity } from 'tsoa'

@Route('/')
@NoSecurity()
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
}
