import { CreateUser } from '@common/types/api/users/createUser'
import { Route, Tags, Controller, Body, Post, SuccessResponse, Response } from 'tsoa'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import prisma from '../PrismaClient'
import logger from '@common/src/logger'

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
  public async register(
    @Body() bodyRequest: CreateUser['Request'],
  ): Promise<CreateUser['Response']> {
    const { password, ...userDetails } = bodyRequest
    try {
      if (
        !userDetails.firstName ||
        !userDetails.lastName ||
        !userDetails.email ||
        !userDetails.role
      ) {
        const error = {
          message: 'Missing required fields: firstName, lastName, email, role',
          token: null,
          userId: null,
        }
        logger.error({ ...error })
        return error
      }
      const hashedPassword = await this.hashPassword(password)
      const insertedUser = await this.userRepo.create({
        data: {
          ...userDetails,
          password: hashedPassword,
        },
      })

      // JWT middleware to protect routes
      if (!process.env.JWT_SECRET) {
        logger.error({ message: 'JWT_SECRET environment variable not set' })
        throw new Error('JWT_SECRET environment variable not set')
      }

      const token = jwt.sign({ userId: insertedUser.id }, process.env.JWT_SECRET, {
        algorithm: 'HS256',
      })

      const responseData = {
        message: `Created user with ID: ${insertedUser.id}`,
        userId: insertedUser.id,
        token,
      }
      logger.info(responseData)

      return responseData
    } catch (error) {
      return { message: 'Email already exists', token: null, userId: null }
    }
  }

  // /**
  //  * login
  //  *
  //  * @summary Login a User
  //  */
  // @Post('/login')
  // @SuccessResponse('200', 'Logged In')
  // @Response('401', 'Unauthorized')
  // @Response('500', 'Internal Server Error')
  // public async login(): Promise<void> {}

  private async hashPassword(password: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const salt = crypto.randomBytes(16)
      crypto.scrypt(password, salt, 64, (err, derivedKey) => {
        if (err) reject(err)
        resolve(salt.toString('hex') + ':' + derivedKey.toString('hex'))
      })
    })
  }

  // private async verifyPassword(hashedPassword: string, password: string): Promise<boolean> {
  //   return new Promise((resolve, reject) => {
  //     const [salt, key] = hashedPassword.split(':')
  //     crypto.scrypt(password, Buffer.from(salt, 'hex'), 64, (err, derivedKey) => {
  //       if (err) reject(err)
  //       resolve(key === derivedKey.toString('hex'))
  //     })
  //   })
  // }
}
