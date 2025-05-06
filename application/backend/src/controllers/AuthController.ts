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
  Middlewares,
  NoSecurity,
} from 'tsoa'
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
import { InvalidCredentialsError, NotFoundError } from '../middlewares/ErrorHandler'
import { ParticipantType } from 'common/types/api/users/ParticipantProfile'
import { createDefaultAnswers } from '../utils/answers'
import { auditLog } from '../middlewares/AuditLog'

@Route('auth')
@Tags('Auth')
@Response<InternalErrorResponse>('500', 'Internal Server Error')
@Response<ValidateErrorResponse>('422', 'Validation Failed')
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
  @NoSecurity()
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
  public async checkSetup(): Promise<{ isSetup: boolean }> {
    const existingUsers = await this.userRepo.count()
    const isSetup = existingUsers != 0
    return { isSetup }
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
      throw new Error('CTRL is already set up')
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

    // TODO: Currently creates an initial study (similar to how initial surveyVersion is created below).
    //       Maybe this could be changed to go immediately to a study creation page where they can set
    //       their desired study name and logo etc.
    const study = await prisma.study.create({
      data: {
        id: 1,
        name: 'Placeholder Study Name',
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
    const invite = await this.inviteRepo.findFirst({ where: { id: inviteId } })
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
   * login
   *
   * @summary Login a User
   */
  @Post('/login')
  @NoSecurity()
  @Response<UnauthorizedErrorResponse>('401', 'Unauthorized')
  public async login(@Body() bodyRequest: LoginRequest): Promise<LoginResponse> {
    // Check if user exists and password matches
    const user = await this.userRepo.findUnique({ where: { email: bodyRequest.email } })

    if (!user || !(await verifyPassword(user.password, bodyRequest.password))) {
      throw new InvalidCredentialsError('Invalid credentials provided')
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
    studyId: number,
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
      if (existingDep) {
        familyId = existingDep.familyId
      }
    }

    // Check if participant exists already
    const existingParticipant = await this.profileRepo.findFirst({
      where: {
        firstName: firstName,
        lastName: lastName,
        dob: new Date(dob),
      },
    })

    if (existingParticipant) {
      logger.error('Participant already exists', {
        'firstName, lastName and dob': {
          message: 'These fields together must be unique',
          value: `${firstName}, ${lastName} and ${dob}`,
        },
      })
      throw new Error('Participant already exists')
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

    // Fetch current survey
    const currentSurvey = await this.surveyRepo.findFirstOrThrow({
      where: {
        status: 'PUBLISHED',
        studyId: studyId,
      },
      orderBy: { id: 'desc' },
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
            dob: new Date(dep.dob),
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
