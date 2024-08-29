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
import logger from 'common/src/logger'
import { type UserCreationRequest, type UserUpdateRequest } from 'common'
import { type User } from '../../prisma/generated/client'
import prisma from '../PrismaClient'

@Route('users')
@Tags('Users')
export class UsersController extends Controller {
  userRepo = prisma.user

  /**
   * Get all Users
   *
   * @summary Get all Users
   */
  @Get('/')
  @SuccessResponse('200', 'OK')
  @Response('500', 'Internal Server Error')
  public async getAllUsers(): Promise<{ message: string; users: User[] }> {
    const users: User[] = await this.userRepo.findMany({})
    const responseData = { message: 'Got all users', users }
    logger.info({ ...responseData })
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
  public async getUserById(
    @Path() userID: number,
  ): Promise<{ message: string; user: User | null }> {
    const user: User | null = await this.userRepo.findUnique({
      where: { id: userID },
    })
    if (!user) {
      const error = { message: `User with ID: ${userID} not found`, user }
      logger.error({ ...error })
      this.setStatus(404)
      return error
    }
    const responseData = { message: `Get user with ID: ${userID}`, user }
    logger.info({ ...responseData })
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
  public async createUser(
    @Body() bodyRequest: UserCreationRequest,
  ): Promise<{ message: string; newUser: User | null }> {
    const { firstName, lastName, email, role } = bodyRequest

    // Validation check
    if (!firstName || !lastName || !email || !role) {
      const error = {
        message: 'Missing required fields: firstName, lastName, email, role',
        newUser: null,
      }
      logger.error({ ...error })
      return error
    }

    try {
      const insertedUser = await this.userRepo.create({ data: bodyRequest })
      const responseData = {
        message: `Created user with ID: ${insertedUser.id}`,
        newUser: insertedUser,
      }
      logger.info({ ...responseData })
      return responseData
    } catch (err) {
      const error = { message: 'Error creating user', newUser: null }
      logger.error({ ...error, err })
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
  public async updateUser(
    @Path() userID: number,
    @Body() bodyRequest: UserUpdateRequest,
  ): Promise<{ message: string; updatedUser: User | null }> {
    try {
      const updatedUser = await this.userRepo.update({
        where: { id: userID },
        data: bodyRequest,
      })
      const responseData = {
        message: `Updated user with ID: ${userID}`,
        updatedUser,
      }
      logger.info({ ...responseData })
      return responseData
    } catch (err) {
      const error = { message: 'Error updating user', updatedUser: null }
      logger.error({ ...error, err })
      return error
    }
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
  public async deleteUser(
    @Path() userID: number,
  ): Promise<{ message: string; deletedUser: User | null }> {
    try {
      const deletedUser = await this.userRepo.delete({ where: { id: userID } })
      const responseData = { message: `Deleted user with ID: ${userID}`, deletedUser }
      logger.info({ ...responseData })
      return responseData
    } catch (err) {
      const error = { message: 'Error deleting user', deletedUser: null }
      logger.error({ ...error, err })
      return error
    }
  }
}
