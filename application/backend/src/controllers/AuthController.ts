import type {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  RegisterParticipantRequest,
  RegisterParticipantResponse,
  CreateParticipantResponse,
  CreateParticipantRequest,
  RegisterSetupRequest,
  OIDCLoginRequest,
  SetupResponse,
} from 'common/types/api/auth'
import {
  Route,
  Tags,
  Controller,
  Path,
  Body,
  Post,
  SuccessResponse,
  Response,
  ValidateError,
  Get,
  Header,
  Middlewares,
  NoSecurity,
  Security,
  Request,
} from 'tsoa'
import * as express from 'express'
import prisma from '../PrismaClient'
import logger from 'common/src/logger'
import { checkPasswordStrength } from 'common/src/PasswordStrength'
import { Role, User } from '@prisma/client'
import { generateToken, hashPassword, verifyPassword } from '../authentication'
import type {
  InternalErrorResponse,
  UnauthorizedErrorResponse,
  ValidateErrorResponse,
} from 'common/types/api/errors'
import {
  IncorrectPermissionsError,
  InvalidCredentialsError,
  NotFoundError,
  UnprocessableError,
} from '../middlewares/ErrorHandler'
import { ParticipantType } from 'common/types/api/users/ParticipantProfile'
import { createDefaultAnswers } from '../utils/answers'
import { auditLog } from '../middlewares/AuditLog'
import config from '../config'
import type { OTPLoginRequest } from 'common/types/api/auth/login'
import { randomInt } from 'node:crypto'
import nodemailer from 'nodemailer'
import { createMailerTransporter, fromAddress } from '../utils/mailer'
import { genId, genIndId } from '../utils/genId'
import { Prefill } from 'common/types/invite'

@Route('auth')
@Tags('Auth')
@Response<InternalErrorResponse>('500', 'Internal Server Error')
@Response<ValidateErrorResponse>('422', 'Validation Failed')
@Response<UnprocessableError>('422', 'Unprocessable Content')
@Middlewares(auditLog)
export class AuthController extends Controller {
  userRepo = prisma.user
  profileRepo = prisma.participantProfile
  studyRepo = prisma.study
  surveyRepo = prisma.surveyVersion
  svaRepo = prisma.surveyVersionAnswers
  inviteRepo = prisma.invite

  /**
   * register
   *
   * @summary Register a new user
   */
  @Post('/register')
  @Security('jwt', ['OrganisationAdmin'])
  @SuccessResponse('201', 'User Created')
  public async registerUser(@Body() bodyRequest: RegisterRequest): Promise<RegisterResponse> {
    const { password, ...userDetails } = bodyRequest

    const { isValid, fields } = await checkPasswordStrength(password)

    if (!isValid) {
      throw new ValidateError(fields, 'Password does not meet strength requirements')
    }

    const hashedPassword = await hashPassword(password)
    const insertedUser: User = await this.userRepo.create({
      data: {
        ...userDetails,
        password: hashedPassword,
      },
    })

    const token = await generateToken({ userId: insertedUser.id, roles: [insertedUser.role] })

    const responseData = {
      token,
    }

    logger.info({ ...responseData })
    return responseData
  }

  /**
   * Check setup
   *
   * @summary Check if CTRL is setup
   */
  @Get('/setup')
  @NoSecurity()
  public async checkSetup(): Promise<SetupResponse> {
    const existingUsers = await this.userRepo.count()
    const isSetup = existingUsers != 0
    return {
      isSetup,
      oidc: (config.oidc || []).map((val) => ({
        name: val.name,
        host: val.providerUrl,
        clientId: val.clientId,
        icon: val.icon,
        displayInAdminPortal: val.displayInAdminPortal,
        displayInUserPortal: val.displayInUserPortal,
      })),
      disableAdminPasswordLogin: config.disableAdminPasswordLogin || false,
    }
  }

  /**
   * register admin
   *
   * @summary Register initial admin user
   */
  @Post('/register/setup')
  @NoSecurity()
  @SuccessResponse('201', 'User Created')
  public async registerInitialUser(
    @Body() bodyRequest: RegisterSetupRequest,
  ): Promise<RegisterResponse> {
    const { password, email } = bodyRequest

    const { isValid, fields } = await checkPasswordStrength(password)

    if (!isValid) {
      throw new ValidateError(fields, 'Password does not meet strength requirements')
    }

    const existingUsers = await this.userRepo.count()
    if (existingUsers > 0) {
      throw new UnprocessableError('CTRL is already set up')
    }

    const hashedPassword = await hashPassword(password)
    const insertedUser: User = await this.userRepo.create({
      data: {
        email,
        firstName: '',
        lastName: '',
        role: 'OrganisationAdmin',
        password: hashedPassword,
      },
    })

    await prisma.organisation.create({ data: { name: 'Default org' } })

    // TODO: Currently creates an initial study (similar to how initial surveyVersion is created below).
    //       Maybe this could be changed to go immediately to a study creation page where they can set
    //       their desired study name and logo etc.
    const study = await prisma.study.create({
      data: {
        id: 1,
        name: 'Default Study',
      },
    })
    // Create initial surveyVersion
    await this.surveyRepo.create({
      data: { data: [], status: 'DRAFT', studyId: study.id, versionNumber: 1 },
    })

    const token = await generateToken({ userId: insertedUser.id, roles: [insertedUser.role] })

    const responseData = {
      token,
    }

    return responseData
  }

  /**
   * registerParticipant
   *
   * @summary Register a participant
   */
  @Post('/register/participants/{inviteId}')
  @NoSecurity()
  @SuccessResponse('201', 'Participant Created')
  public async registerParticipant(
    @Path() inviteId: string,
    @Body() bodyRequest: RegisterParticipantRequest,
  ): Promise<RegisterParticipantResponse> {
    // Extract info for user creation
    const { firstName, middleName, lastName, email, password, ...participantInfo } = bodyRequest

    // Check that the Participant has an invitation
    const invite = await this.inviteRepo.findFirst({ where: { id: inviteId, email } })
    if (!invite || invite.status !== 'PENDING') {
      throw new NotFoundError(`Invite for ${email} not found`)
    }

    // Check and hash Password
    const { isValid, fields } = await checkPasswordStrength(password)
    if (!isValid) {
      throw new ValidateError(fields, 'Password does not meet strength requirements')
    }
    const hashedPassword = await hashPassword(password)

    // Create User
    const data = {
      firstName: firstName,
      middleName: middleName,
      lastName: lastName,
      email: email,
      role: Role.Participant,
      password: hashedPassword,
      agreedTermsAt: new Date(),
    }

    const insertedUser = await this.userRepo.create({ data })

    // Extract info for participant creation
    const participantData: CreateParticipantRequest = {
      firstName,
      lastName,
      ...participantInfo,
      ...(JSON.parse(invite.prefill || '{}') as Prefill).studyParticipant,
    }
    const study = await this.studyRepo.findFirstOrThrow({ where: { id: invite.studyId } })
    await this.createParticipant(participantData, study.id, insertedUser)
    logger.info(`Participant ${insertedUser.id} created`)

    // Generate token
    const token = await generateToken({ userId: insertedUser.id, roles: [insertedUser.role] })

    const responseData = {
      id: insertedUser.id,
      token,
    }

    // Once a participant has been registered, we need
    // to update their invitation status to ACCEPTED
    const res = await this.inviteRepo.update({
      where: { id: inviteId },
      data: { status: 'ACCEPTED' },
    })

    if (!res) {
      logger.error('No invitation found for email: ', email)
      throw new NotFoundError(`Invite for ${email} not found`)
    }

    return responseData
  }

  /**
   * OIDC login
   *
   * @summary Login using OIDC
   */
  @Post('/login/oidc')
  @NoSecurity()
  @Response<UnauthorizedErrorResponse>('401', 'Unauthorized')
  public async loginOIDC(
    @Body() bodyRequest: OIDCLoginRequest,
    @Header('x-client-type') clientType?: string,
  ): Promise<LoginResponse> {
    if (!config.oidc) {
      throw new Error('OIDC Not Configured')
    }

    const oidc = config.oidc.find((val) => val.name === bodyRequest.provider)

    if (!oidc) {
      throw new Error('OIDC Provider not found')
    }

    const { clientId, clientSecret, providerUrl } = oidc

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: bodyRequest.redirect_uri,
      code: bodyRequest.code,
    })

    let user

    try {
      const oidc_data = await fetch(`${providerUrl}/.well-known/openid-configuration`)

      const { token_endpoint, userinfo_endpoint } = await oidc_data.json()

      const token_res = await fetch(token_endpoint, {
        body,
        method: 'POST',
      })

      const { access_token } = await token_res.json()

      const userinfo_res = await fetch(userinfo_endpoint, {
        body: new URLSearchParams({ access_token }),
        method: 'POST',
      })

      const { email } = await userinfo_res.json()
      user = await this.userRepo.findFirst({ where: { email } })
    } catch {
      throw new Error('Error authenticating with OIDC')
    }

    if (!user) {
      throw new IncorrectPermissionsError('User does not have admin privileges')
    }

    if (!user || (clientType === 'admin-client' && user.role !== 'OrganisationAdmin')) {
      throw new IncorrectPermissionsError('User does not have admin privileges')
    }

    const token = await generateToken({ userId: user.id, roles: [user.role] })
    return { token }
  }

  /**
   * login
   *
   * @summary Login a User
   */
  @Post('/login')
  @NoSecurity()
  @Response<UnauthorizedErrorResponse>('401', 'Unauthorized')
  public async login(
    @Body() bodyRequest: LoginRequest,
    @Header('x-client-type') clientType?: string,
  ): Promise<LoginResponse> {
    // Check if user exists and password matches
    const user = await this.userRepo.findUnique({ where: { email: bodyRequest.email } })

    if (!user) {
      throw new InvalidCredentialsError('User not found')
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new InvalidCredentialsError(
        `Account locked until ${user.lockedUntil.toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })} (AEST)`,
      )
    }

    if (user.retriesRemaining < 1) {
      const lockDuration = await this.lockUser(user.id)
      await this.userRepo.update({ where: { id: user.id }, data: { retriesRemaining: 10 } })
      throw new InvalidCredentialsError(`Retries exceeded, account locked for ${lockDuration}`)
    }

    // Check client type and roles
    if (clientType === 'admin-client' && user.role !== 'OrganisationAdmin') {
      throw new IncorrectPermissionsError('User does not have admin privileges')
    }
    if (clientType === 'user-client' && user.role !== 'Participant') {
      throw new IncorrectPermissionsError('User is not a participant')
    }

    if (!(await verifyPassword(user.password, bodyRequest.password))) {
      await this.userRepo.update({
        where: { id: user.id },
        data: { retriesRemaining: user.retriesRemaining - 1 },
      })
      throw new InvalidCredentialsError('Invalid credentials provided')
    }
    let responseData

    if (config.otp) {
      const zeroPad = (num: number, places: number) => String(num).padStart(places, '0')
      const code = zeroPad(randomInt(9999), 4)
      const otp = await prisma.oTPToken.create({
        data: {
          code,
          userId: user.id,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 mins in future
        },
      })
      responseData = {
        otp_token: otp.id,
      }
      const mailToUserOptions: nodemailer.SendMailOptions = {
        from: fromAddress,
        to: user.email,
        subject: 'CTRL - One Time Password',
        text: `Your CTRL login code is: ${code}`,
      }

      const mailerTransporter = await createMailerTransporter()

      mailerTransporter.sendMail(mailToUserOptions)
    } else {
      await this.userRepo.update({ where: { id: user.id }, data: { retriesRemaining: 10 } })
      const token = await generateToken({ userId: user.id, roles: [user.role] })
      responseData = {
        token,
      }
      logger.info({ ...responseData })
    }

    return responseData
  }

  /**
   * One time password
   *
   * @summary Log in with a OTP code
   */
  @Post('/login/otp')
  @NoSecurity()
  @Response<UnauthorizedErrorResponse>('401', 'Unauthorized')
  public async loginOtp(
    @Body() bodyRequest: OTPLoginRequest,
    @Header('x-client-type') clientType?: string,
  ): Promise<LoginResponse> {
    const otp = await prisma.oTPToken.findUnique({
      where: { id: bodyRequest.otp_token },
    })

    if (!otp) {
      throw new Error('Bad request')
    }

    const user = await this.userRepo.findFirstOrThrow({ where: { id: otp.userId } })

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new InvalidCredentialsError(
        `Account locked until ${user.lockedUntil.toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })}`,
      )
    }

    if (user.retriesRemaining < 1) {
      await this.userRepo.update({ where: { id: user.id }, data: { retriesRemaining: 10 } })
      const lockDuration = await this.lockUser(user.id)
      throw new InvalidCredentialsError(`Retries exceeded, account locked for ${lockDuration}`)
    }

    if (otp?.code !== bodyRequest.otp_code) {
      await this.userRepo.update({
        where: { id: user.id },
        data: { retriesRemaining: user.retriesRemaining - 1 },
      })
      throw new InvalidCredentialsError('Invalid code')
    }

    if (otp.expiresAt < new Date()) {
      throw new InvalidCredentialsError('Code expired')
    }

    // Check client type and roles
    if (clientType === 'admin-client' && user.role !== 'OrganisationAdmin') {
      throw new IncorrectPermissionsError('User does not have admin privileges')
    }
    if (clientType === 'user-client' && user.role !== 'Participant') {
      throw new IncorrectPermissionsError('User is not a participant')
    }

    const token = await generateToken({ userId: user.id, roles: [user.role] })
    await this.userRepo.update({ where: { id: user.id }, data: { retriesRemaining: 10 } })

    const responseData = {
      token,
    }

    await prisma.oTPToken.delete({ where: { id: otp.id } })

    return responseData
  }

  /**
   * Terms and conditions link
   *
   * @summary Redirects to configured terms and conditions url
   */

  @Get('/tcs')
  @NoSecurity()
  @SuccessResponse(302, 'Redirect')
  public async tcs(@Request() request: express.Request) {
    const response = (<any>request).res as express.Response
    const tcLink = (await prisma.organisation.findFirstOrThrow({})).tcLink
    response.redirect(tcLink)
  }

  private async lockUser(userId: number) {
    const user = await this.userRepo.findFirstOrThrow({ where: { id: userId } })
    let lockTimeMS = 10 * 60 * 1000
    let lockDurationString = '10 minutes'
    if (
      user.lockedUntil &&
      // Has been locked within last 24 hours
      user.lockedUntil > new Date(new Date().getTime() - 24 * 60 * 60 * 1000)
    ) {
      lockTimeMS = 24 * 60 * 60 * 1000 // 24 hours
      lockDurationString = '24 hours'
    }
    await this.userRepo.update({
      where: { id: userId },
      data: { lockedUntil: new Date(new Date().getTime() + lockTimeMS) },
    })
    return lockDurationString
  }

  public async createParticipant(
    participantData: CreateParticipantRequest,
    studyId: number,
    user?: User,
  ): Promise<CreateParticipantResponse> {
    // Extract user and profile data
    const { firstName, lastName, dob, externalId, ...profileData } = participantData
    const { nextOfKin, dependents, ...noNextOfKinProfileData } = profileData
    const nextOfKinCreateData = { nextOfKin: { create: { ...nextOfKin } } }

    // Check for existing dependents
    let familyId
    if (dependents.length > 0) {
      const existingDep = await this.profileRepo.findFirst({
        where: {
          firstName: dependents[0].firstName,
          lastName: dependents[0].lastName,
          dob: dependents[0].dob,
        },
      })
      if (existingDep) {
        familyId = existingDep.familyId
      }
    }

    // Check if participant exists already
    const existingParticipant = await this.profileRepo.findFirst({
      where: {
        firstName: firstName,
        lastName: lastName,
        dob: dob,
      },
    })

    if (existingParticipant) {
      logger.error('Participant already exists', {
        'firstName, lastName and dob': {
          message: 'These fields together must be unique',
          value: `${firstName}, ${lastName} and ${dob}`,
        },
      })
      throw new UnprocessableError('Participant already exists')
    }

    // Create Profile
    const profile = await this.profileRepo.create({
      data: {
        ...(user ? { user: { connect: { id: user.id } } } : {}),
        ...noNextOfKinProfileData,
        ...nextOfKinCreateData,
        firstName: firstName,
        lastName: lastName,
        dob: dob,
        familyId,
        studies: {
          create: {
            study: {
              connect: {
                id: studyId,
              },
            },
          },
        },
        participantType:
          dependents.length > 0 ? ParticipantType.GUARDIAN : ParticipantType.STANDARD,
      },
    })

    if (externalId) {
      await prisma.studyParticipant.update({
        where: { participantProfileId_studyId: { participantProfileId: profile.id, studyId } },
        data: { externalId },
      })
    }

    await genIndId(profile.id)

    //Generate unique Ids
    await genId(studyId, profile.id)

    // Fetch current survey
    const currentSurvey = await this.surveyRepo.findFirstOrThrow({
      where: {
        status: 'PUBLISHED',
        studyId: studyId,
      },
      orderBy: { versionNumber: 'desc' },
    })

    // Create profiles for dependents if no existing family ID
    if (!familyId) {
      for (const dep of dependents) {
        const depProfile = await this.profileRepo.create({
          data: {
            ...noNextOfKinProfileData,
            ...nextOfKinCreateData,
            firstName: dep.firstName,
            lastName: dep.lastName,
            dob: dep.dob,
            familyId: profile.familyId,
            studies: {
              create: {
                study: {
                  connect: {
                    id: studyId,
                  },
                },
              },
            },
            participantType: dep.permanent
              ? ParticipantType.DEPENDENT_OTHER
              : ParticipantType.DEPENDENT_AGE,
          },
        })
        await genId(studyId, depProfile.id)
        await genIndId(depProfile.id)
        if (currentSurvey) {
          await this.svaRepo.create({
            data: {
              profileId: depProfile.id,
              versionId: currentSurvey.id,
              answers: createDefaultAnswers(currentSurvey.data),
            },
          })
        }
      }
    }

    // Assign survey to the main profile
    if (currentSurvey) {
      await this.svaRepo.create({
        data: {
          profileId: profile.id,
          versionId: currentSurvey.id,
          answers: createDefaultAnswers(currentSurvey.data),
        },
      })
    }
    return { id: profile.id }
  }
}
