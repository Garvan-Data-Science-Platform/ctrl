import cors from 'cors'
import { backendPort } from '../../common/src/index'
import express, { type Application, type Router } from 'express'
import { type Server } from 'http'
import swaggerUi from 'swagger-ui-express'
import YAML from 'yaml'
import fs from 'fs'

export class Api {
  public app: Application
  private server?: Server
  public port: number = backendPort

  constructor(WorkspacesRouter: Router, SomeModuleRouter: Router, UsersRouter: Router) {
    // App config
    this.app = express()
    this.app.use(express.json())
    this.app.use(cors())

    // Documentation config
    const swaggerFile = fs.readFileSync('./swagger.yaml', 'utf8')
    const swaggerDoc = YAML.parse(swaggerFile)
    this.app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc))

    // Routers
    this.app.use('/workspaces', WorkspacesRouter)
    this.app.use('/somemodule', SomeModuleRouter)
    this.app.use('/users', UsersRouter)
  }

  run(): void {
    this.server = this.app.listen(this.port, () => {})
    console.log(`Listening on http://localhost:${backendPort}`)
    console.log(`Documentation at http://localhost:${backendPort}/docs`)
  }

  stop(): void {
    if (this.server != null) {
      this.server.close()
    }
  }
}
