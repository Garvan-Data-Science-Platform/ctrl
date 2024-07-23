import { WorkspacesRouter } from './routes/WorkspacesRouter'
import { Api } from './Api'
import { SomeModuleRouter } from './routes/SomeModuleRouter'
import { UsersRouter } from './routes/UsersRouter'
import Database from './Database'

const main = async (): Promise<void> => {
  // Setup Database
  Database.init()

  // Setup and run Api
  const api = new Api(WorkspacesRouter(), SomeModuleRouter(), UsersRouter())
  api.run()
}

main()
  .then(() => {})
  .catch((err) => {
    console.error({ error: err })
  })
