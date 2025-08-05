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
  ValidateError,
  Middlewares,
  NoSecurity,
} from 'tsoa'
import logger from 'common/src/logger'
import type {
  GetUserByIdResponse,
  GetAllUsersResponse,
  CreateUserRequest,
  CreateUserResponse,
  UpdateUserRequest,
  UpdateUserRoleRequest,
  GeneratePasswordResetLinkRequest,
  ResetPasswordRequest,
} from 'common/types/api/users'
import { User } from '@prisma/client'
import prisma from '../PrismaClient'
import {
  InternalErrorResponse,
  NotFoundErrorResponse,
  UnauthorizedErrorResponse,
  ValidateErrorResponse,
} from 'common/types/api/errors'
import { NotFoundError, PasswordResetTokenInvalidError } from '../middlewares/ErrorHandler'
import { hashPassword } from '../authentication'
import { checkPasswordStrength } from 'common/src/PasswordStrength'
import { generatePasswordResetEmail } from '../utils/passwordResetTemplate'
import crypto, { randomBytes } from 'crypto'
import nodemailer from 'nodemailer'
import { createMailerTransporter, fromAddress } from '../utils/mailer'
import { auditLog } from '../middlewares/AuditLog'

@Route('users')
@Tags('Users')
@Response<InternalErrorResponse>('500', 'Internal Server Error')
@Middlewares(auditLog)
export class UsersController extends Controller {
  userRepo = prisma.user
  passwordResetTokenRepo = prisma.passwordResetToken

  /**
   * Get all Users
   *
   * @summary Get all Users
   */
  @Get('/')
  @Security('jwt', ['OrganisationAdmin'])
  @Response<UnauthorizedErrorResponse>('401', 'Unauthorized')
  public async getAllUsers(): Promise<GetAllUsersResponse> {
    const users: User[] = await this.userRepo.findMany({})
    const responseData = { data: users }
    logger.info({ ...responseData })
    return responseData
  }

  /**
   * Get all Admin Users
   *
   * @summary Get all Admin Users
   */
  @Get('/admin')
  @Security('jwt', ['OrganisationAdmin'])
  @Response<UnauthorizedErrorResponse>('401', 'Unauthorized')
  public async getAllAdminUsers(): Promise<GetAllUsersResponse> {
    const users: User[] = await this.userRepo.findMany({
      where: { role: { in: ['OperatorAdmin', 'OrganisationAdmin'] } },
    })
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
  @Security('jwt', ['OrganisationAdmin'])
  @Response<NotFoundErrorResponse>('404', 'Not Found')
  @Response<UnauthorizedErrorResponse>('401', 'Unauthorized')
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
  @Security('jwt', ['OrganisationAdmin'])
  @Response<ValidateErrorResponse>('422', 'Validation Failed')
  @Response<UnauthorizedErrorResponse>('401', 'Unauthorized')
  public async createUser(@Body() bodyRequest: CreateUserRequest): Promise<CreateUserResponse> {
    try {
      const password = hashPassword(randomBytes(8).toString('hex'))
      const insertedUser = await this.userRepo.create({
        data: { ...bodyRequest, password },
      })
      const responseData = {
        id: insertedUser.id,
      }
      await this.generatePasswordResetLink({ email: bodyRequest.email })
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
  @Security('jwt', ['OrganisationAdmin'])
  @Response<NotFoundErrorResponse>('404', 'Not Found')
  @Response<ValidateErrorResponse>('422', 'Validation Failed')
  @Response<UnauthorizedErrorResponse>('401', 'Unauthorized')
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
  @Security('jwt', ['OrganisationAdmin'])
  @Response<NotFoundErrorResponse>('404', 'Not Found')
  @Response<UnauthorizedErrorResponse>('401', 'Unauthorized')
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
  @Security('jwt', ['OperatorAdmin'])
  @Response<NotFoundErrorResponse>('404', 'Not Found')
  @Response<UnauthorizedErrorResponse>('401', 'Unauthorized')
  public async updateUserRole(
    @Path() userID: number,
    @Body() bodyRequest: UpdateUserRoleRequest,
  ): Promise<void> {
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
  @NoSecurity()
  @Response<NotFoundErrorResponse>('404', 'Not Found')
  public async generatePasswordResetLink(
    @Body() bodyRequest: GeneratePasswordResetLinkRequest,
  ): Promise<void> {
    const user = await prisma.user.findUnique({ where: { email: bodyRequest.email } })

    if (!user) {
      // Not throwing here/returning error as a security precaution
      logger.error('User not found')
      return
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

    const { html, text } = generatePasswordResetEmail(resetLink, user.firstName)

    const mailToUserOptions: nodemailer.SendMailOptions = {
      from: fromAddress,
      to: user.email,
      subject: 'CTRL - Password Reset Link',
      text,
      html,
    }

    const mailerTransporter = await createMailerTransporter()

    await mailerTransporter.sendMail(mailToUserOptions)
  }

  @Post('/password/reset')
  @SuccessResponse('200', 'OK')
  @NoSecurity()
  @Response<NotFoundErrorResponse>('404', 'Not Found')
  @Response<UnauthorizedErrorResponse>('403', 'Forbidden')
  public async resetPassword(@Body() bodyRequest: ResetPasswordRequest): Promise<void> {
    const { token, newPassword } = bodyRequest
    const passwordResetToken = await this.passwordResetTokenRepo.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!passwordResetToken) {
      throw new PasswordResetTokenInvalidError('Reset token invalid')
    }

    if (passwordResetToken.used) {
      throw new PasswordResetTokenInvalidError('Reset token has already been used')
    }

    if (passwordResetToken.expiresAt < new Date()) {
      throw new PasswordResetTokenInvalidError('Reset token expired')
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
  }
}
