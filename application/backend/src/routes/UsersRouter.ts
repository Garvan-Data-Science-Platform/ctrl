import { Request, Response, Router } from 'express'
import { User } from '../entities/User'

/* TODO: Remove when implementing DB
 ** - need to remove the refs to users list in each endpoint
 */
const users: User[] = []
let nextId = 1

export const UsersRouter = (): Router => {
  const router: Router = Router()

  router.get('/', async (req: Request, res: Response) => {
    console.log({ msg: 'Get all users', users })
    res.status(200).json({ data: users })
  })

  router.get('/:id', async (req: Request, res: Response) => {
    const user = users.find((user) => user.id === parseInt(req.params.id, 10))
    console.log({ msg: `Get user w/ ID: ${req.params.id}`, user })
    res.status(200).json({ data: user })
  })

  router.post('/', async (req: Request, res: Response) => {
    const newUser = new User(
      nextId++,
      req.body.name,
      req.body.email,
      req.body.role,
      req.body.organisations,
    )
    console.log({ msg: `Creates user`, newUser })
    users.push(newUser)
    res.status(200).json({ data: newUser })
  })

  router.delete('/:id', async (req: Request, res: Response) => {
    const updatedUsers = users.filter((user) => user.id !== parseInt(req.params.id, 10))
    console.log({ msg: `Delete user w/ ID: ${req.params.id}`, updatedUsers })
    res.status(200).json({ data: updatedUsers })
  })

  return router
}
