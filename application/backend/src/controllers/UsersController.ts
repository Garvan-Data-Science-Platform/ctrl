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
  GetAllUsersResponse,
  CreateUserRequest,
  CreateUserResponse,
  UpdateUserRequest,
  UpdateUserRoleRequest,
} from 'common/types/api/users'
import { User } from '@prisma/client'
import prisma from '../PrismaClient'
import {
  InternalErrorResponse,
  NotFoundErrorResponse,
  UnauthorizedErrorResponse,
  ValidateErrorResponse,
} from 'common/types/api/errors'
import { NotFoundError } from '../middlewares/ErrorHandler'

@Route('users')
@Tags('Users')
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
  @Security('jwt', ['OrganisationAdmin'])
  public async getAllUsers(): Promise<GetAllUsersResponse> {
    const users: User[] = await this.userRepo.findMany({})
    const responseData = { data: users }
    logger.info({ ...responseData })
    return responseData
  }

  /**
   * Gets a Specific User using their ID
   *
   * @summary Get Specific User
   */
  @Get('/{userId}')
  @Response<NotFoundErrorResponse>('404', 'Not Found')
  @Security('jwt')
  public async getUserById(@Path() userId: number): Promise<GetUserByIdResponse> {
    const user: User | null = await this.userRepo.findUnique({
      where: { id: userId },
    })
    if (!user) {
      const errorMessage: string = `User with ID: ${userId} not found`
      logger.error({ errorMessage })
      throw new NotFoundError(errorMessage)
    }
    const responseData = { data: user }
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
  @Response<ValidateErrorResponse>('422', 'Validation Failed')
  @Security('jwt', ['OrganisationAdmin'])
  public async createUser(@Body() bodyRequest: CreateUserRequest): Promise<CreateUserResponse> {
    try {
      const insertedUser = await this.userRepo.create({
        data: { ...bodyRequest, password: 'temp_password_hash' },
      })
      const responseData = {
        id: insertedUser.id,
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
  @Patch('/{userId}')
  @Response<NotFoundErrorResponse>('404', 'Not Found')
  @Response<ValidateErrorResponse>('422', 'Validation Failed')
  @Security('jwt', ['OrganisationAdmin'])
  public async updateUser(@Path() userId: number, @Body() bodyRequest: UpdateUserRequest) {
    try {
      await this.userRepo.update({
        where: { id: userId },
        data: bodyRequest,
      })
    } catch (err) {
      const errorMessage: string = `User with ID: ${userId} not found`
      logger.error({ errorMessage, err })
      throw new NotFoundError(errorMessage)
    }
  }

  /**
   * Delete a user.
   *
   * @summary Delete a User
   */
  @Delete('/{userId}')
  @Response<NotFoundErrorResponse>('404', 'Not Found')
  @Security('jwt', ['OrganisationAdmin'])
  public async deleteUser(@Path() userId: number) {
    try {
      await this.userRepo.delete({ where: { id: userId } })
      return
    } catch (err) {
      const errorMessage: string = `User with ID: ${userId} not found`
      logger.error({ errorMessage, err })
      throw new NotFoundError(errorMessage)
    }
  }

  /**
   * Update a users role.
   *
   * @summary Update a Users Role
   */
  @Patch('/{userID}/role')
  @Response<NotFoundErrorResponse>('404', 'Not Found')
  @Security('jwt', ['OperatorAdmin'])
  public async updateUserRole(@Path() userID: number, @Body() bodyRequest: UpdateUserRoleRequest) {
    try {
      await this.userRepo.update({
        where: { id: userID },
        data: {
          role: bodyRequest.newRole,
        },
      })
      return
    } catch (err) {
      const errorMessage: string = `User with ID: ${userID} not found`
      logger.error({ errorMessage, err })
      throw new NotFoundError(errorMessage)
    }
  }
}
