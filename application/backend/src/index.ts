import { WorkspacesRouter } from './routes/WorkspacesRouter'
import { Api } from './Api'
import { SomeModuleRouter } from './routes/SomeModuleRouter'

const main = async (): Promise<void> => {
  // Setup and run Api
  const api = new Api(WorkspacesRouter(), SomeModuleRouter())
  api.run()
}

main()
  .then(() => {})
  .catch((err) => {
    console.error({ error: err })
  })
