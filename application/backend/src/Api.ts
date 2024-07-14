import { backendPort } from '../../common/src/index'
import express, { type Application, type Router } from 'express'
import { type Server } from 'http'

export class Api {
  public app: Application
  private server?: Server
  public port: number = backendPort

  constructor(WorkspacesRouter: Router, SomeModuleRouter: Router) {
    // App config
    this.app = express()
    this.app.use(express.json())

    // Routers
    this.app.use('/workspaces', WorkspacesRouter)
    this.app.use('/somemodule', SomeModuleRouter)
  }

  run(): void {
    this.server = this.app.listen(this.port, () => {})
  }

  stop(): void {
    if (this.server != null) {
      this.server.close()
    }
  }
}
