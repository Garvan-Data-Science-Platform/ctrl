import type {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
} from 'common/types/api/auth'
import { Route, Tags, Controller, Body, Post, SuccessResponse, Response, ValidateError } from 'tsoa'
import prisma from '../PrismaClient'
import logger from 'common/src/logger'
import { checkPasswordStrength } from 'common/src/PasswordStrength'
import { User } from '@prisma/client'
import { generateToken, hashPassword, verifyPassword } from '../authentication'

@Route('auth')
@Tags('Auth')
export class AuthController extends Controller {
  userRepo = prisma.user

  /**
   * register
   *
   * @summary Register a new user
   */
  @Post('/register')
  @SuccessResponse('201', 'User Created')
  @Response('422', 'Validation Failed')
  @Response('500', 'Internal Server Error')
  public async register(@Body() bodyRequest: RegisterRequest): Promise<RegisterResponse> {
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

    const token = await generateToken(insertedUser.id)

    const responseData = {
      message: `Created user with ID: ${insertedUser.id}`,
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
  @Response('401', 'Unauthorized')
  @Response('500', 'Internal Server Error')
  public async login(@Body() bodyRequest: LoginRequest): Promise<LoginResponse> {
    try {
      // Check if user exists and password matches
      const user = await this.userRepo.findUnique({ where: { email: bodyRequest.email } })
      if (!user || !(await verifyPassword(user.password, bodyRequest.password))) {
        this.setStatus(401)
        throw Error('Invalid email or password')
      }

      const token = await generateToken(user.id)
      const responseData = {
        message: 'Logged in Successfully!',
        token,
      }

      logger.info({ ...responseData })

      return responseData
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Could not login'
      const error = { message: errorMessage, token: null }
      logger.error({ ...error, err })
      return error
    }
  }
}
