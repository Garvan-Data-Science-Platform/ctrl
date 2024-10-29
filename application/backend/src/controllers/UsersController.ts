import {
  Get,
  Patch,
  Post,
  Delete,
  Route,
  Tags,
  Path,
  Body,
  SuccessResponse,
  Response,
  Controller,
  Security,
} from 'tsoa'
import logger from 'common/src/logger'
import type {
  GetUserByIdResponse,
  DeleteUserResponse,
  GetAllUsersResponse,
  CreateUserRequest,
  CreateUserResponse,
  UpdateUserRequest,
  UpdateUserResponse,
} from 'common/types/api/users'
import { User } from '@prisma/client'
import prisma from '../PrismaClient'
import {
  InternalErrorResponse,
  NotFoundErrorResponse,
  UnauthorizedErrorResponse,
} from 'common/types/api/errors'
import { NotFoundError } from '../middlewares/ErrorHandler'

@Route('users')
@Tags('Users')
@Security('jwt')
@Response<UnauthorizedErrorResponse>('401', 'Unauthorized')
@Response<InternalErrorResponse>('500', 'Internal Server Error')
export class UsersController extends Controller {
  userRepo = prisma.user

  /**
   * Get all Users
   *
   * @summary Get all Users
   */
  @Get('/')
  @SuccessResponse('200', 'OK')
  public async getAllUsers(): Promise<GetAllUsersResponse> {
    const users: User[] = await this.userRepo.findMany({})
    const responseData = { message: 'Got all users', data: users }
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
  @Response<NotFoundErrorResponse>('404', 'Not Found')
  public async getUserById(@Path() userID: number): Promise<GetUserByIdResponse> {
    const user: User | null = await this.userRepo.findUnique({
      where: { id: userID },
    })
    if (!user) {
      const errorMessage: string = `User with ID: ${userID} not found`
      logger.error({ errorMessage })
      throw new NotFoundError(errorMessage)
    }
    const responseData = { message: `Got user with ID: ${userID}`, data: user }
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
  public async createUser(@Body() bodyRequest: CreateUserRequest): Promise<CreateUserResponse> {
    try {
      const insertedUser = await this.userRepo.create({
        data: { ...bodyRequest, password: 'temp_password_hash' },
      })
      const responseData = {
        message: `Created user with ID: ${insertedUser.id}`,
        newUser: insertedUser,
      }
      logger.info({ ...responseData })
      return responseData
    } catch (err) {
      const errorMessage: string = 'Error creating user'
      logger.error({ errorMessage, err })
      throw new Error(errorMessage)
    }
  }

  /**
   * Update an existing user.
   *
   * @summary Update a User
   */
  @Patch('/{userID}')
  @SuccessResponse('200', 'OK')
  @Response<NotFoundErrorResponse>('404', 'Not Found')
  public async updateUser(
    @Path() userID: number,
    @Body() bodyRequest: UpdateUserRequest,
  ): Promise<UpdateUserResponse> {
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
      const errorMessage: string = `User with ID: ${userID} not found`
      logger.error({ errorMessage, err })
      throw new NotFoundError(errorMessage)
    }
  }

  /**
   * Delete a user.
   *
   * @summary Delete a User
   */
  @Delete('/{userID}')
  @SuccessResponse('200', 'OK')
  @Response<NotFoundErrorResponse>('404', 'Not Found')
  public async deleteUser(@Path() userID: number): Promise<DeleteUserResponse> {
    try {
      const deletedUser = await this.userRepo.delete({ where: { id: userID } })
      const responseData = { message: `Deleted user with ID: ${userID}` }
      logger.info({ ...responseData, deletedUser })
      return responseData
    } catch (err) {
      const errorMessage: string = `User with ID: ${userID} not found`
      logger.error({ errorMessage, err })
      throw new NotFoundError(errorMessage)
    }
  }
}
