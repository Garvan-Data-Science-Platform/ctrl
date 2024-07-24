import { Request, Response, Router } from 'express'
import { User } from '../entities/User'
import Database from '../Database'
import { QueryResult } from 'pg'

export const UsersRouter = (): Router => {
  const router: Router = Router()
  const db: Database = Database.getInstance()

  router.get('/', async (req: Request, res: Response) => {
    const result: QueryResult<User[]> = await db.query('SELECT * FROM users')
    const responseData = { msg: 'Got all users', users: result.rows }
    console.log(responseData)
    res.status(200).json({ data: responseData })
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
    const responseData = { msg: `Get user w/ ID: ${req.params.id}`, user }
    console.log(responseData)
    res.status(200).json({ data: responseData })
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

    try {
      const result = await db.query(
        'INSERT INTO users (first_name, email, user_role, organisations) VALUES ($1, $2, $3, $4) RETURNING *',
        [firstName, email, role, organisations],
      )
      const insertedUser = result.rows[0]
      const responseData = {
        msg: `Created user w/ ID: ${insertedUser.user_id}`,
        newUser: insertedUser,
      }
      console.log(responseData)
      res.status(200).json({
        data: responseData,
      })
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
    try {
      await db.query(updateQuery, [firstName, email, role, organisation, userID])
    } catch (err) {
      const error = { msg: 'Error updating user', error: err }
      console.error(error)
      res.status(500).json(error)
      return
    }

    const updatedResult: QueryResult<User> = await db.query(
      `SELECT * FROM users WHERE user_id = ${userID}`,
    )

    if (updatedResult.rows.length !== 1) {
      // No user found
      const error = { msg: `User w/ ID: ${userID} not found` }
      console.error(error)
      res.status(404).json({ error })
      return
    }

    const responseData = { msg: `Update user w/ ID: ${userID}`, updatedUser: updatedResult.rows[0] }
    console.log(responseData)
    res.status(200).json({ data: responseData })
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

    const responseData = { msg: `Deleted user w/ ID: ${userID}`, deletedUser: result.rows[0] }
    console.log(responseData)
    res.status(200).json({ data: responseData })
  })
  return router
}
