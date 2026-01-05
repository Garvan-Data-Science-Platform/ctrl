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
  Request,
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
import {
  NotFoundError,
  PasswordResetTokenInvalidError,
  UnprocessableError,
} from '../middlewares/ErrorHandler'
import { hashPassword } from '../authentication'
import type { RequestWithAuthentication } from '../authentication'
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
  @Security('jwt', ['OrganisationAdmin', 'StudyAdmin'])
  @Response<UnauthorizedErrorResponse>('401', 'Unauthorized')
  public async getAllAdminUsers(): Promise<GetAllUsersResponse> {
    const users: User[] = await this.userRepo.findMany({
      where: { role: { in: ['OperatorAdmin', 'OrganisationAdmin', 'StudyAdmin'] } },
      include: { adminOfStudies: { select: { id: true, name: true } } },
      orderBy: { id: 'asc' },
    })
    const responseData = { data: users }
    logger.info({ ...responseData })
    return responseData
  }

  /**
   * Get all deleted Admin Users
   *
   * @summary Get all deleted Organisation and Study Admin Users
   */
  @Get('/admin/deleted')
  @Security('jwt', ['OrganisationAdmin', 'StudyAdmin'])
  @Response<UnauthorizedErrorResponse>('401', 'Unauthorized')
  public async getDeletedAdminUsers(
    @Request() request: RequestWithAuthentication,
  ): Promise<GetAllUsersResponse> {
    if (
      (await prisma.user.findUniqueOrThrow({ where: { id: request.user.userId } })).role ==
      'StudyAdmin'
    ) {
      return { data: [] }
    }
    const users: User[] = await this.userRepo.findMany({
      where: { role: { in: ['OperatorAdmin', 'OrganisationAdmin', 'StudyAdmin'] }, deleted: true },
    })
    const responseData = { data: users }
    return responseData
  }

  /**
   * Restore deleted user
   *
   * @summary Restore deleted user by Id
   */
  @Patch('/{userId}/restore')
  @Security('jwt', ['OrganisationAdmin'])
  @Response<NotFoundErrorResponse>('404', 'Not Found')
  @Response<UnauthorizedErrorResponse>('401', 'Unauthorized')
  public async restoreUserById(@Path() userId: number) {
    await this.userRepo.update({ where: { id: userId, deleted: true }, data: { deleted: false } })
  }

  /**
   * Gets a Specific User using their ID
   *
   * @summary Get Specific User
   */
  @Get('/{userId}')
  @Security('jwt', ['OrganisationAdmin', 'StudyAdmin'])
  @Response<NotFoundErrorResponse>('404', 'Not Found')
  @Response<UnauthorizedErrorResponse>('401', 'Unauthorized')
  public async getUserById(@Path() userId: number): Promise<GetUserByIdResponse> {
    const user: User | null = await this.userRepo.findUnique({
      where: { id: userId },
      include: { adminOfStudies: { select: { name: true, id: true } } },
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
  @Security('jwt', ['OrganisationAdmin', 'StudyAdmin'])
  @Response<ValidateErrorResponse>('422', 'Validation Failed')
  @Response<UnauthorizedErrorResponse>('401', 'Unauthorized')
  public async createUser(
    @Request() request: RequestWithAuthentication,
    @Body() bodyRequest: CreateUserRequest,
  ): Promise<CreateUserResponse> {
    const callingUser = await this.userRepo.findUniqueOrThrow({
      where: { id: request.user.userId },
    })
    if (callingUser.role == 'StudyAdmin' && bodyRequest.role !== 'StudyAdmin') {
      throw new UnprocessableError('As a study admin, you can only create other study admins')
    }

    const isDeleted =
      (await this.userRepo.count({ where: { email: bodyRequest.email, deleted: true } })) > 0
    if (isDeleted) {
      throw new UnprocessableError(
        'This email belongs to a deleted user, you must restore the user instead of creating a new one',
      )
    }
    const emailExists = (await this.userRepo.count({ where: { email: bodyRequest.email } })) > 0
    if (emailExists) {
      throw new UnprocessableError('Email already exists')
    }
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
  }

  /**
   * Update an existing user.
   *
   * @summary Update a User
   */
  @Patch('/{userId}')
  @Security('jwt', ['OrganisationAdmin', 'StudyAdmin'])
  @Response<NotFoundErrorResponse>('404', 'Not Found')
  @Response<ValidateErrorResponse>('422', 'Validation Failed')
  @Response<UnauthorizedErrorResponse>('401', 'Unauthorized')
  public async updateUser(
    @Request() request: RequestWithAuthentication,
    @Path() userId: number,
    @Body() bodyRequest: UpdateUserRequest,
  ) {
    const callingUser = await this.userRepo.findUniqueOrThrow({
      where: { id: request.user.userId },
    })
    const targetUser = await this.userRepo.findUniqueOrThrow({ where: { id: userId } })
    if (callingUser.role == 'StudyAdmin') {
      if (targetUser.id !== callingUser.id) {
        throw new UnprocessableError(
          'Study admins cannot edit details of other study/organisation admins',
        )
      }
      if (bodyRequest.role && bodyRequest.role !== targetUser.role) {
        throw new UnprocessableError('Study admins cannot edit roles')
      }
    }
    if (
      targetUser.id == callingUser.id &&
      bodyRequest.role &&
      bodyRequest.role !== targetUser.role
    ) {
      throw new UnprocessableError('Cannot edit your own role')
    }

    await this.userRepo.update({
      where: { id: userId },
      data: bodyRequest,
    })
  }

  /**
   * Make a user a study admin
   *
   * @summary Make a user admin of a study
   */
  @Post('/{userId}/make-study-admin/{studyId}')
  @Security('jwt', ['OrganisationAdmin', 'StudyAdmin'])
  public async makeStudyAdmin(
    @Request() request: RequestWithAuthentication,
    @Path() userId: number,
    @Path() studyId: number,
  ) {
    if (!request.user.studies.includes(studyId)) {
      throw new UnprocessableError('You do not have admin permissions for this study')
    }
    await this.userRepo.update({
      where: { id: userId, role: 'StudyAdmin' },
      data: { adminOfStudies: { connect: { id: studyId } } },
    })
  }

  /**
   * Remove a user as admin of a study
   *
   * @summary Remove a study admin
   */
  @Post('/{userId}/remove-study-admin/{studyId}')
  @Security('jwt', ['OrganisationAdmin', 'StudyAdmin'])
  public async removeStudyAdmin(
    @Request() request: RequestWithAuthentication,
    @Path() userId: number,
    @Path() studyId: number,
  ) {
    if (!request.user.studies.includes(studyId)) {
      throw new UnprocessableError('You do not have admin permissions for this study')
    }
    await this.userRepo.update({
      where: { id: userId, role: 'StudyAdmin' },
      data: { adminOfStudies: { disconnect: { id: studyId } } },
    })
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
