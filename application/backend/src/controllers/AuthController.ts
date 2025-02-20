import type {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  RegisterParticipantRequest,
  RegisterParticipantResponse,
  CreateParticipantResponse,
  CreateParticipantRequest,
} from 'common/types/api/auth'
import { Route, Tags, Controller, Body, Post, SuccessResponse, Response, ValidateError } from 'tsoa'
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
import { IncorrectPasswordError, NotFoundError } from '../middlewares/ErrorHandler'
import { createDefaultAnswers } from 'common/src/surveys/createDefaultAnswers'
import { ParticipantType } from 'common/types/api/users/ParticipantProfile'

@Route('auth')
@Tags('Auth')
@Response<InternalErrorResponse>('500', 'Internal Server Error')
@Response<ValidateErrorResponse>('422', 'Validation Failed')
export class AuthController extends Controller {
  userRepo = prisma.user
  profileRepo = prisma.participantProfile
  surveyRepo = prisma.surveyVersion
  spRepo = prisma.surveyParticipant
  inviteRepo = prisma.invite

  /**
   * register
   *
   * @summary Register a new user
   */
  @Post('/register')
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
   * registerParticipant
   *
   * @summary Register a participant
   */
  @Post('/register/participant')
  @SuccessResponse('201', 'Participant Created')
  public async registerParticipant(
    @Body() bodyRequest: RegisterParticipantRequest,
  ): Promise<RegisterParticipantResponse> {
    // Extract info for user creation
    const { firstName, middleName, lastName, email, password, ...participantInfo } = bodyRequest

    // Check that the Participant has an invitation
    const invite = await this.inviteRepo.findFirst({ where: { email } })
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
    }

    const insertedUser = await this.userRepo.create({ data })

    // Extract info for participant creation
    const participantData: CreateParticipantRequest = { firstName, lastName, ...participantInfo }
    await this.createParticipant(participantData, insertedUser)
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
      where: { email },
      data: { status: 'ACCEPTED' },
    })

    if (!res) {
      logger.error('No invitation found for email: ', email)
      throw new NotFoundError(`Invite for ${email} not found`)
    }

    return responseData
  }

  /**
   * login
   *
   * @summary Login a User
   */
  @Post('/login')
  @Response<UnauthorizedErrorResponse>('401', 'Unauthorized')
  public async login(@Body() bodyRequest: LoginRequest): Promise<LoginResponse> {
    // Check if user exists and password matches
    const user = await this.userRepo.findUnique({ where: { email: bodyRequest.email } })
    if (!user) {
      throw new NotFoundError(`User ${bodyRequest.email} does not exist`)
    }

    if (!(await verifyPassword(user.password, bodyRequest.password))) {
      throw new IncorrectPasswordError()
    }

    const token = await generateToken({ userId: user.id, roles: [user.role] })
    const responseData = {
      token,
    }

    logger.info({ ...responseData })

    return responseData
  }

  public async createParticipant(
    participantData: CreateParticipantRequest,
    user?: User,
  ): Promise<CreateParticipantResponse> {
    // Extract user and profile data
    const { firstName, lastName, dob, ...profileData } = participantData
    const { nextOfKin, dependents, ...noNextOfKinProfileData } = profileData
    const nextOfKinCreateData = { nextOfKin: { create: { ...nextOfKin } } }

    // Check for existing dependents
    let familyId
    if (dependents.length > 0) {
      const existingDep = await this.profileRepo.findFirst({
        where: {
          firstName: dependents[0].firstName,
          lastName: dependents[0].lastName,
          dob: new Date(dependents[0].dob),
        },
      })
      console.log('EXISTING DEP', existingDep)
      if (existingDep) {
        familyId = existingDep.familyId
      }
    }

    // Create Profile
    const profile = await this.profileRepo.create({
      data: {
        ...(user ? { user: { connect: { id: user.id } } } : {}),
        ...noNextOfKinProfileData,
        ...nextOfKinCreateData,
        firstName: firstName,
        lastName: lastName,
        dob: new Date(dob),
        familyId,
        participantType:
          dependents.length > 0 ? ParticipantType.GUARDIAN : ParticipantType.STANDARD,
      },
    })

    // Fetch current survey
    const currentSurvey = await this.surveyRepo.findFirstOrThrow({
      where: { status: 'PUBLISHED' },
      orderBy: { versionNumber: 'desc' },
    })

    // Create profiles for dependents if no existing family ID
    if (!familyId) {
      for (const dep of dependents) {
        await this.profileRepo.create({
          data: {
            ...noNextOfKinProfileData,
            firstName: dep.firstName,
            lastName: dep.lastName,
            dob: new Date(dep.dob),
            familyId: profile.familyId,
            participantType: dep.permanent
              ? ParticipantType.DEPENDENT_OTHER
              : ParticipantType.DEPENDENT_AGE,
          },
        })
      }
    }

    // Assign survey to the main profile
    if (currentSurvey) {
      await this.spRepo.create({
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
