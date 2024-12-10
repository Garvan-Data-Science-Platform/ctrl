import type {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  RegisterParticipantRequest,
  RegisterParticipantResponse,
} from 'common/types/api/auth'
import { Route, Tags, Controller, Body, Post, SuccessResponse, Response, ValidateError } from 'tsoa'
import prisma from '../PrismaClient'
import logger from 'common/src/logger'
import { checkPasswordStrength } from 'common/src/PasswordStrength'
import { User, Role, ParticipantType } from '@prisma/client'
import { generateToken, hashPassword, verifyPassword } from '../authentication'
import type {
  InternalErrorResponse,
  UnauthorizedErrorResponse,
  ValidateErrorResponse,
} from 'common/types/api/errors'
import { IncorrectPasswordError, NotFoundError } from '../middlewares/ErrorHandler'
import { createDefaultAnswers } from 'common/src/surveys/createDefaultAnswers'
import { createParticipant } from '../createParticipant'

@Route('auth')
@Tags('Auth')
@Response<InternalErrorResponse>('500', 'Internal Server Error')
@Response<ValidateErrorResponse>('422', 'Validation Failed')
export class AuthController extends Controller {
  userRepo = prisma.user
  profileRepo = prisma.participantProfile
  surveyRepo = prisma.surveyVersion
  spRepo = prisma.surveyParticipant

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
      message: `Registered user with ID: ${insertedUser.id}`,
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
    /**const { password, ...participantData } = bodyRequest

    // Check Password
    const { isValid, fields } = await checkPasswordStrength(password)

    if (!isValid) {
      throw new ValidateError(fields, 'Password does not meet strength requirements')
    }

    const hashedPassword = await hashPassword(password)

    // Pull out data from request
    const { firstName, middleName, lastName, email, dob, ...profileData } = participantData
    const userDetails = { firstName, middleName, lastName, email }

    const { nextOfKin, dependents, ...noNextOfKinProfileData } = profileData

    const nextOfKinCreateData = { nextOfKin: { create: { ...nextOfKin } } }

    const data = {
      ...userDetails,
      role: Role.Participant,
      password: hashedPassword,
    }
    const insertedUser = await this.userRepo.create({
      data,
    })

    //Check if dependents already exist
    let familyId
    if (dependents.length > 0) {
      const existingDep = await this.profileRepo.findFirst({
        where: {
          firstName: dependents[0].firstName,
          lastName: dependents[0].lastName,
          dob: new Date(dependents[0].dob),
        },
      })
      if (existingDep) {
        familyId = existingDep.familyId
      }
    }

    const profile = await this.profileRepo.create({
      data: {
        userId: insertedUser.id,
        ...noNextOfKinProfileData,
        ...nextOfKinCreateData,
        firstName: insertedUser.firstName,
        lastName: insertedUser.lastName,
        dob: new Date(dob),
        familyId,
        participantType:
          dependents.length > 0 ? ParticipantType.GUARDIAN : ParticipantType.STANDARD,
      },
    })

    const currentSurvey = await this.surveyRepo.findFirst({
      where: { status: 'PUBLISHED' },
      orderBy: { versionNumber: 'desc' },
    })

    //familyId only defined when dependent profile already existed
    if (!familyId) {
      for (const dep of dependents) {
        const res = await this.profileRepo.create({
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
        if (currentSurvey) {
          await this.spRepo.create({
            data: {
              profileId: res.id,
              versionId: currentSurvey.id,
              answers: createDefaultAnswers(currentSurvey.data),
            },
          })
        }
      }
    }

    if (currentSurvey) {
      await this.spRepo.create({
        data: {
          profileId: profile.id,
          versionId: currentSurvey.id,
          answers: createDefaultAnswers(currentSurvey.data),
        },
      })
    }

    const token = await generateToken({ userId: insertedUser.id, roles: [insertedUser.role] })

    const responseData = {
      message: `Created participant with user ID: ${insertedUser.id}`,
      token,
    }

    logger.info({ ...responseData })
    return responseData**/
    return createParticipant(bodyRequest, this.userRepo, this.surveyRepo, this.profileRepo, this.spRepo)
  }

  /**
   * login
   *
   * @summary Login a User
   */
  @Post('/login')
  @SuccessResponse('200', 'Logged In')
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
      message: 'Logged in Successfully!',
      token,
    }

    logger.info({ ...responseData })

    return responseData
  }
}
