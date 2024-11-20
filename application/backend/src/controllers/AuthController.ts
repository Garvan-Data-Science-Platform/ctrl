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
import { User, Role } from '@prisma/client'
import { generateToken, hashPassword, verifyPassword } from '../authentication'
import type {
  InternalErrorResponse,
  UnauthorizedErrorResponse,
  ValidateErrorResponse,
} from 'common/types/api/errors'
import { IncorrectPasswordError, NotFoundError } from '../middlewares/ErrorHandler'

@Route('auth')
@Tags('Auth')
@Response<InternalErrorResponse>('500', 'Internal Server Error')
@Response<ValidateErrorResponse>('422', 'Validation Failed')
export class AuthController extends Controller {
  userRepo = prisma.user

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
    const { password, ...participantData } = bodyRequest

    // Check Password
    const { isValid, fields } = await checkPasswordStrength(password)

    if (!isValid) {
      throw new ValidateError(fields, 'Password does not meet strength requirements')
    }

    const hashedPassword = await hashPassword(password)

    // Pull out data from request
    const { firstName, middleName, lastName, email, dob, ...profileData } = participantData
    const userDetails = { firstName, middleName, lastName, email }

    const { nextOfKin, onBehalfOf, ...noNextOfKinProfileData } = profileData

    let onBehalfOfCreateData
    let onBehalfOfDOB
    if (onBehalfOf) {
      onBehalfOfDOB = new Date(onBehalfOf.dob)
      onBehalfOfCreateData = { onBehalfOf: { create: { ...onBehalfOf, dob: onBehalfOfDOB } } }
    }

    let nextOfKinCreateData
    if (nextOfKin) {
      nextOfKinCreateData = { nextOfKin: { create: { ...nextOfKin } } }
    }

    const data = {
      ...userDetails,
      role: Role.Participant,
      password: hashedPassword,
      profile: {
        create: {
          dob: new Date(dob),
          ...noNextOfKinProfileData,
          ...onBehalfOfCreateData,
          ...nextOfKinCreateData,
        },
      },
    }
    const insertedUser = await this.userRepo.create({
      data,
    })

    const token = await generateToken({ userId: insertedUser.id, roles: [insertedUser.role] })

    const responseData = {
      message: `Created participant with user ID: ${insertedUser.id}`,
      token,
    }

    logger.info({ ...responseData })
    return responseData
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
