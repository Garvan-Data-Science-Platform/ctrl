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
  Request,
  Controller,
  Security,
  ValidateError,
} from 'tsoa'
import logger from 'common/src/logger'
import type {
  GetUserByIdResponse,
  GetAllUsersResponse,
  CreateUserRequest,
  CreateUserResponse,
  UpdateUserRequest,
  UpdateUserRoleRequest,
  GeneratePasswordResetLinkResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
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
import { MailerService } from '../services/MailerService'
import { hashPassword } from '../authentication'
import { checkPasswordStrength } from 'common/src/PasswordStrength'
import express from 'express'
import crypto from 'crypto'

@Route('users')
@Tags('Users')
@Response<UnauthorizedErrorResponse>('401', 'Unauthorized')
@Response<InternalErrorResponse>('500', 'Internal Server Error')
export class UsersController extends Controller {
  userRepo = prisma.user
  mailerService = new MailerService()

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
  /**
   * Generate Password Reset Link
   *
   * @summary Generate and send a password reset link to the user
   */
  @Post('/password/generate-reset-link')
  @SuccessResponse('200', 'OK')
  @Security('jwt')
  @Response<NotFoundErrorResponse>('404', 'Not Found')
  public async generatePasswordResetLink(
    @Request() request: express.Request,
  ): Promise<GeneratePasswordResetLinkResponse> {
    if (!request.user) {
      throw new NotFoundError('User not found')
    }

    const userId: number = request.user.userId
    const user = await prisma.user.findUnique({ where: { id: userId } })

    if (!user) {
      throw new NotFoundError('User not found')
    }

    // Generate a secure random token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 Minutes expiration

    // Save token to database
    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    })

    const resetLink = `${process.env.HOSTNAME}/reset-password?token=${token}`

    await this.mailerService.sendEmail(user.email, 'CTRL - Password Reset Link', resetLink)

    return { message: `Password Reset Link has been sent to ${user.email}` }
  }

  @Post('/password/reset')
  @SuccessResponse('200', 'OK')
  @Security('jwt')
  @Response<NotFoundErrorResponse>('404', 'Not Found')
  public async resetPassword(
    @Body() bodyRequest: ResetPasswordRequest,
  ): Promise<ResetPasswordResponse> {
    const { token, newPassword } = bodyRequest
    const passwordResetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!passwordResetToken || passwordResetToken.used) {
      throw new Error('Invalid or used reset token')
    }

    if (passwordResetToken.expiresAt < new Date()) {
      throw new Error('Reset token expired')
    }

    // Validate the new password against the strength requirements
    const { isValid, fields } = await checkPasswordStrength(newPassword)

    if (!isValid) {
      throw new ValidateError(fields, 'New password does not meet strength requirements')
    }

    const hashedPassword = await hashPassword(newPassword)

    // Update the user's password
    await prisma.user.update({
      where: { id: passwordResetToken.userId },
      data: { password: hashedPassword },
    })

    // Mark the token as used
    await prisma.passwordResetToken.update({
      where: { id: passwordResetToken.id },
      data: { used: true },
    })

    return {
      message: 'Password reset successfully',
    }
  }
}
