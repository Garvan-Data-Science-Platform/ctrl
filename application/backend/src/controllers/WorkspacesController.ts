import { Workspace } from 'common/src/index'
import { Controller, Get, Route, SuccessResponse, Tags, Response } from 'tsoa'

const workspaces: Workspace[] = [
  { name: 'backend', version: '1.0.0' },
  { name: 'common', version: '1.0.0' },
  { name: 'frontend', version: '1.0.0' },
]

@Route('workspaces')
@Tags('Workspaces')
export class WorkspacesController extends Controller {
  /**
   * Get all Workspaces
   *
   * @summary Get all Workspaces
   */
  @Get('/')
  @SuccessResponse('200', 'OK')
  @Response('500', 'Internal Server Error')
  public async getAllWorkspaces(): Promise<Workspace[]> {
    return workspaces
  }
}
