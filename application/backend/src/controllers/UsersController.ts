import {
  Get,
  Put,
  Post,
  Delete,
  Route,
  Tags,
  Path,
  Body,
  SuccessResponse,
  Response,
  Controller,
} from 'tsoa'
import Database from '../Database'
import { User } from '../entities/User'

interface UserCreationRequest {
  firstName: string
  email: string
  role: string
  organisations: string[]
}

interface UserUpdateRequest {
  firstName?: string
  email?: string
  role?: string
  organisation?: string
}

@Route('users')
@Tags('Users')
export class UsersController extends Controller {
  private db: Database = Database.getInstance()

  /**
   * Get all Users
   *
   * @summary Get all Users
   */
  @Get('/')
  @SuccessResponse('200', 'OK')
  @Response('500', 'Internal Server Error')
  public async getAllUsers(): Promise<{ msg: string; users: User[] }> {
    const result = await this.db.query('SELECT * FROM users')
    const responseData = { msg: 'Got all users', users: result.rows }
    console.log(responseData)
    return responseData
  }

  /**
   * Gets a Specific User using their ID
   *
   * @summary Get Specific User
   */
  @Get('/{userID}')
  @SuccessResponse('200', 'OK')
  @Response('500', 'Internal Server Error')
  public async getUserById(@Path() userID: number): Promise<{ msg: string; user: User | null }> {
    const result = await this.db.query('SELECT * FROM users WHERE user_id = $1', [userID])
    if (result.rows.length !== 1) {
      console.error(`User with ID: ${userID} not found`)
      this.setStatus(404)
      return { msg: `User with ID: ${userID} not found`, user: null }
    }
    const user = result.rows[0]
    const responseData = { msg: `Get user w/ ID: ${userID}`, user }
    console.log(responseData)
    return responseData
  }

  /**
   * Create and persist a new user.
   *
   * @summary Create a new User
   */
  @Post('/')
  @SuccessResponse('201', 'Created')
  @Response('500', 'Internal Server Error')
  public async createUser(@Body() bodyRequest: UserCreationRequest) {
    const { firstName, email, role, organisations } = bodyRequest

    // Validation check
    if (!firstName || !email || !role || !organisations) {
      const error = { msg: 'Missing required fields: first_name, email, role, organisations' }
      console.error(error)
      return error
    }

    try {
      const result = await this.db.query(
        'INSERT INTO users (first_name, email, user_role, organisations) VALUES ($1, $2, $3, $4) RETURNING *',
        [firstName, email, role, organisations],
      )
      const insertedUser = result.rows[0]
      const responseData = {
        msg: `Created user w/ ID: ${insertedUser.user_id}`,
        newUser: insertedUser,
      }
      console.log(responseData)
      return responseData
    } catch (err) {
      const error = { msg: 'Error creating user', error: err }
      console.error(error)
      return error
    }
  }

  /**
   * Update an existing user.
   *
   * @summary Update a User
   */
  @Put('/{userID}')
  @SuccessResponse('200', 'OK')
  @Response('500', 'Internal Server Error')
  @Response('404', 'Not Found')
  public async updateUser(@Path() userID: number, @Body() bodyRequest: UserUpdateRequest) {
    // Check if the user exists in the database
    const result = await this.db.query(`SELECT * FROM users WHERE user_id = ${userID}`)

    if (result.rows.length !== 1) {
      // No user found
      const error = { msg: `User w/ ID: ${userID} not found` }
      console.error(error)
      return error
    }

    const { firstName, email, role, organisation } = bodyRequest

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
      await this.db.query(updateQuery, [firstName, email, role, organisation, userID])
    } catch (err) {
      const error = { msg: 'Error updating user', error: err }
      console.error(error)
      return error
    }

    const updatedResult = await this.db.query(`SELECT * FROM users WHERE user_id = ${userID}`)

    if (updatedResult.rows.length !== 1) {
      // No user found
      const error = { msg: `User w/ ID: ${userID} not found` }
      console.error(error)
      return error
    }

    const responseData = { msg: `Update user w/ ID: ${userID}`, updatedUser: updatedResult.rows[0] }
    console.log(responseData)
    return responseData
  }

  /**
   * Delete a user.
   *
   * @summary Delete a User
   */
  @Delete('/{userID}')
  @SuccessResponse('200', 'OK')
  @Response('500', 'Internal Server Error')
  @Response('404', 'Not Found')
  public async deleteUser(@Path() userID: number) {
    // Check if the user exists in the database
    const result = await this.db.query(`SELECT * FROM users WHERE user_id = ${userID}`)

    if (result.rows.length !== 1) {
      // No user found
      const error = { msg: `User w/ ID: ${userID} not found` }
      console.error(error)
      return error
    }

    // Delete the user from the database
    await this.db.query(`DELETE FROM users WHERE user_id = ${userID}`)

    const responseData = { msg: `Deleted user w/ ID: ${userID}`, deletedUser: result.rows[0] }
    console.log(responseData)
    return responseData
  }
}
