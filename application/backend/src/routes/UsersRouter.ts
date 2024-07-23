import { Request, Response, Router } from 'express'
import { User } from '../entities/User'
import Database from '../Database'
import { QueryResult } from 'pg'

export const UsersRouter = (): Router => {
  const router: Router = Router()
  const db: Database = Database.getInstance()

  router.get('/', async (req: Request, res: Response) => {
    const result: QueryResult<User[]> = await db.query('SELECT * FROM users')
    console.log({ msg: 'Get all users', result: result.rows })
    res.status(200).json({ data: result.rows })
  })

  router.get('/:id', async (req: Request, res: Response) => {
    const userID = parseInt(req.params.id, 10)
    const result: QueryResult<User> = await db.query(
      `SELECT * FROM users WHERE user_id = ${userID}`,
    )
    const user = result.rows[0]

    if (result.rows.length !== 1) {
      // No user found
      const error = { msg: `User w/ ID: ${req.params.id} not found` }
      console.error(error)
      res.status(404).json({ error })
      return
    }
    console.log({ msg: `Get user w/ ID: ${req.params.id}`, user })
    res.status(200).json({ data: user })
  })

  router.post('/', async (req: Request, res: Response) => {
    const { firstName, email, role, organisations } = req.body

    // Validation check
    if (!firstName || !email || !role || !organisations) {
      const error = { msg: 'Missing required fields: first_name, email, role, organisations' }
      console.error(error)
      res.status(400).json({ error })
      return
    }

    const newUser = new User(firstName, email, role, organisations)
    console.log({ msg: `Creates user`, newUser })
    try {
      const result = await db.query(
        'INSERT INTO users (first_name, email, user_role, organisations) VALUES ($1, $2, $3, $4) RETURNING *',
        [firstName, email, role, organisations],
      )
      const insertedUser = result.rows[0]
      res.status(200).json({ data: insertedUser })
    } catch (err) {
      const error = { msg: 'Error creating user', error: err }
      console.error(error)
      res.status(500).json(error)
    }
  })

  router.put('/:id', async (req: Request, res: Response) => {
    const userID = parseInt(req.params.id, 10)
    const { firstName, email, role, organisation } = req.body

    // Check if the user exists in the database
    const result: QueryResult<User> = await db.query(
      `SELECT * FROM users WHERE user_id = ${userID}`,
    )

    if (result.rows.length !== 1) {
      // No user found
      const error = { msg: `User w/ ID: ${userID} not found` }
      console.error(error)
      res.status(404).json({ error })
      return
    }

    const updateQuery = `
      UPDATE users
      SET first_name = COALESCE($1, first_name),
          email = COALESCE($2, email),
          user_role = COALESCE($3, user_role),
          organisations = array_append(COALESCE(organisations, '{}'), $4)
      WHERE user_id = $5
      RETURNING *
    `

    const updatedUserResult: QueryResult<User> = await db.query(updateQuery, [
      firstName,
      email,
      role,
      organisation,
      userID,
    ])

    const updatedUser = updatedUserResult.rows[0]
    console.log({ msg: `Update user w/ ID: ${userID}`, updatedUser })
    res.status(200).json({ data: updatedUser })
  })

  router.delete('/:id', async (req: Request, res: Response) => {
    const userID = parseInt(req.params.id, 10)

    // Check if the user exists in the database
    const result: QueryResult<User> = await db.query(
      `SELECT * FROM users WHERE user_id = ${userID}`,
    )

    if (result.rows.length !== 1) {
      // No user found
      const error = { msg: `User w/ ID: ${userID} not found` }
      console.error(error)
      res.status(404).json({ error })
      return
    }
    // Delete the user from the database
    await db.query(`DELETE FROM users WHERE user_id = ${userID}`)

    console.log({ msg: `Deleted user w/ ID: ${userID}` })
    res.status(200).json({ data: {} })
  })
  return router
}
