import { Request, Response, Router } from 'express'
import { User } from 'src/entities/User'

const users: User[] = []
let nextId = 1

export const UsersRouter = (): Router => {
  const router: Router = Router()

  router.get('/', async (req: Request, res: Response) => {
    console.log(users)
    res.status(200).json({ data: users })
  })

  router.get('/:id', async (req: Request, res: Response) => {
    const user = users.find((user) => user.id === parseInt(req.params.id, 10))
    console.log(user)
    res.status(200).json({ data: user })
  })

  router.post('/', async (req: Request, res: Response) => {
    const user = new User(
      nextId++,
      req.body.name,
      req.body.email,
      req.body.role,
      req.body.organisations,
    )
    users.push(user)
    res.status(200).json({ data: user })
  })

  router.delete('/', async (req: Request, res: Response) => {
    const updatedUsers = users.filter((user) => user.id !== parseInt(req.body.id, 10))
    users.length = 0
    users.push(...updatedUsers)
    res.status(200).json({ data: updatedUsers })
  })

  return router
}
