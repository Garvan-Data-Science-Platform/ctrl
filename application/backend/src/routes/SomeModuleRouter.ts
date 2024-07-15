import { Request, Response, Router } from 'express'
import { add, subtract } from '../SomeModule'

export const SomeModuleRouter = (): Router => {
  const router: Router = Router()
  router.post('/add', async (req: Request, res: Response) => {
    const result = add(req.body.num1, req.body.num2)
    res.status(200).json({ result })
  })

  router.post('/subtract', async (req: Request, res: Response) => {
    const result = subtract(req.body.num1, req.body.num2)
    res.status(200).json({ result })
  })

  router.get('/', async (_, res: Response) => {
    res.status(200).json({})
  })

  return router
}
