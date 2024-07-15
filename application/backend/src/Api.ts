import cors from 'cors'
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
    this.app.use(cors())

    // Routers
    this.app.use('/workspaces', WorkspacesRouter)
    this.app.use('/somemodule', SomeModuleRouter)
  }

  run(): void {
    this.server = this.app.listen(this.port, () => {})
    console.log(`Listening on http://localhost:${backendPort}`)
  }

  stop(): void {
    if (this.server != null) {
      this.server.close()
    }
  }
}
