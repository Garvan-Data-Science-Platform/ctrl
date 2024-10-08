import type {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
} from 'common/types/api/auth'
import { Route, Tags, Controller, Body, Post, SuccessResponse, Response, ValidateError } from 'tsoa'
import jsonwebtoken from 'jsonwebtoken'
import crypto from 'crypto'
import prisma from '../PrismaClient'
import logger from 'common/src/logger'
import { User } from '@prisma/client'

const JWT_EXPIRY = process.env.JWT_EXPIRY || '1h'

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

    try {
      // Validation check
      if (
        !userDetails.firstName ||
        !userDetails.lastName ||
        !userDetails.email ||
        !userDetails.role ||
        !password
      ) {
        throw Error(
          'Missing required fields: firstName, lastName, email, password, role',
        ) as ValidateError
      }

      const hashedPassword = await this.hashPassword(password)
      const insertedUser: User = await this.userRepo.create({
        data: {
          ...userDetails,
          password: hashedPassword,
        },
      })

      const token = await this.generateToken(insertedUser.id)

      const responseData = {
        message: `Created user with ID: ${insertedUser.id}`,
        token,
      }

      logger.info({ ...responseData })

      return responseData
    } catch (err) {
      const error = { message: 'Could not Register User', token: null }
      console.log(err)
      logger.error({ ...error, err })
      return error
    }
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
      // Validation check
      if (!bodyRequest.email || !bodyRequest.password) {
        throw Error('Missing required fields: email, password') as ValidateError
      }

      // Check if user exists and password matches
      const user = await this.userRepo.findUnique({ where: { email: bodyRequest.email } })
      if (!user || !(await this.verifyPassword(user.password, bodyRequest.password))) {
        throw Error('Invalid email or password')
      }

      const token = await this.generateToken(user.id)
      const responseData = {
        message: 'Logged In',
        token,
        error: null,
      }

      logger.info({ ...responseData })

      return responseData
    } catch (err) {
      const error = { message: 'Could not Login User', token: null, error: err as Error }
      logger.error({ ...error, err })
      return error
    }
  }

  private async hashPassword(password: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const salt = crypto.randomBytes(16)
      crypto.scrypt(password, salt, 64, (err, derivedKey) => {
        if (err) reject(err)
        resolve(salt.toString('hex') + ':' + derivedKey.toString('hex'))
      })
    })
  }

  private async generateToken(userId: number): Promise<string> {
    if (!process.env.JWT_SECRET) {
      logger.error({ message: 'JWT_SECRET environment variable not set' })
      throw new Error('JWT_SECRET environment variable not set')
    }

    // Generate JWT token
    return jsonwebtoken.sign({ userId }, process.env.JWT_SECRET, {
      algorithm: 'HS256',
      expiresIn: JWT_EXPIRY,
    })
  }

  private async verifyPassword(hashedPassword: string, password: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const [salt, key] = hashedPassword.split(':')
      crypto.scrypt(password, Buffer.from(salt, 'hex'), 64, (err, derivedKey) => {
        if (err) reject(err)
        resolve(key === derivedKey.toString('hex'))
      })
    })
  }
}
