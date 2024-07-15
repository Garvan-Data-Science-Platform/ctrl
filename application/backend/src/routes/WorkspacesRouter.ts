import { Router } from 'express'
import { Workspace } from 'common'

const workspaces: Workspace[] = [
  { name: 'backend', version: '1.0.0' },
  { name: 'common', version: '1.0.0' },
  { name: 'frontend', version: '1.0.0' },
]

export const WorkspacesRouter = (): Router => {
  const router: Router = Router()
  router.get('/', async (_, res) => {
    console.log(workspaces)
    res.status(200).json({ data: workspaces })
  })

  return router
}
