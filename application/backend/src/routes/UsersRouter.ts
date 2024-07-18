import { Request, Response, Router } from 'express'
import { User } from '../entities/User'

/* TODO: Remove when implementing DB
 ** - need to remove the refs to users list in each endpoint
 ** - exporting for testing purposes (when db is implemented we should mock this in tests)
 */
export const users: User[] = []
let nextId = 1

export const UsersRouter = (): Router => {
  const router: Router = Router()

  router.get('/', async (req: Request, res: Response) => {
    console.log({ msg: 'Get all users', users })
    res.status(200).json({ data: users })
  })

  router.get('/:id', async (req: Request, res: Response) => {
    const user = users.find((user) => user.id === parseInt(req.params.id, 10))
    if (!user) {
      // No user found
      const error = { msg: `User w/ ID: ${req.params.id} not found` }
      console.log(error)
      res.status(404).json({ error })
      return
    }

    console.log({ msg: `Get user w/ ID: ${req.params.id}`, user })
    res.status(200).json({ data: user })
  })

  router.post('/', async (req: Request, res: Response) => {
    const { name, email, role, organisations } = req.body

    // Validation check
    if (!name || !email || !role || !organisations) {
      const error = { msg: 'Missing required fields: name, email, role, organisations' }
      console.log(error)
      res.status(400).json({ error })
      return
    }

    const newUser = new User(nextId++, name, email, role, organisations)
    console.log({ msg: `Creates user`, newUser })
    // TODO: Add user to the database instead of the in-memory array
    users.push(newUser)
    res.status(200).json({ data: newUser })
  })

  router.put('/:id', async (req: Request, res: Response) => {
    const userID = req.params.id
    const { name, email, role, organisations } = req.body

    const user = users.find((user) => user.id === parseInt(userID, 10))
    if (!user) {
      // No user found
      const error = { msg: `User w/ ID: ${userID} not found` }
      console.log(error)
      res.status(404).json({ error })
      return
    }

    user.updateName(name)
    user.updateEmail(email)
    user.updateRole(role)
    user.updateOrganisations(organisations)

    console.log({ msg: `Update user w/ ID: ${userID}`, user })
    // TODO: Update user in the database instead of the in-memory array
    res.status(200).json({ data: user })
  })

  router.delete('/:id', async (req: Request, res: Response) => {
    const userID = req.params.id
    const updatedUsers = users.filter((user) => user.id !== parseInt(userID, 10))
    if (updatedUsers.length === users.length) {
      // Nothing has been filtered out
      const error = { msg: `User w/ ID: ${userID} not found` }
      console.log(error)
      res.status(404).json({ error })
      return
    }

    // Update the users list to reflect the deletion
    // TODO: Delete user from database instead
    users.length = 0
    users.push(...updatedUsers)

    console.log({ msg: `Delete user w/ ID: ${userID}`, updatedUsers })
    res.status(200).json({ data: updatedUsers })
  })

  return router
}
