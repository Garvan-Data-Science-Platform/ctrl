/* eslint-disable @typescript-eslint/no-explicit-any */
import * as express from 'express'
import * as jwt from 'jsonwebtoken'
import logger from 'common/src/logger'
import * as crypto from 'crypto'
import {
  NoTokenError,
  IncorrectPermissionsError,
  UnprocessableError,
  NotFoundError,
} from './middlewares/ErrorHandler'
import prisma from './PrismaClient'

export interface RequestWithAuthentication {
  path: string
  user: {
    userId: number
    studies: number[]
  }
}

export function expressAuthentication(
  request: express.Request,
  securityName: string,
  scopes?: string[],
): Promise<any> {
  if (securityName === 'jwt') {
    // Extract token from Authorization header
    const token = request.headers['authorization']?.split(' ')[1]

    return new Promise((resolve, reject) => {
      if (!token) {
        reject(new NoTokenError())
        return
      }

      if (!process.env.JWT_SECRET) {
        logger.error({ message: 'JWT_SECRET environment variable not set' })
        throw new UnprocessableError('JWT_SECRET environment variable not set')
      }

      jwt.verify(token, process.env.JWT_SECRET, async function (err: any, decoded: any) {
        if (err) {
          reject(err)
          return
        } else {
          try {
            if (scopes) {
              const user = await prisma.user.findUniqueOrThrow({
                where: { id: decoded.userId },
                select: { role: true, adminOfStudies: { select: { id: true } } },
              })
              if (!scopes.includes(user.role)) {
                reject(
                  new IncorrectPermissionsError({
                    message: 'JWT does not contain required scope.',
                    scopes,
                  }),
                )
                return
              }
              if (user.role == 'StudyAdmin') {
                decoded['studies'] = user.adminOfStudies.map((val) => val.id)
                // For any StudyAdmin protected route, if the url has /studies/x/..., check that user is an admin of that study
                const match = request.path.match(/^\/studies\/(\d+)/)
                if (match && !decoded['studies'].includes(Number(match[1]))) {
                  reject(new NotFoundError('Study not found'))
                  return
                }
              } else if (user.role == 'OperatorAdmin' || user.role == 'OrganisationAdmin') {
                decoded['studies'] = (
                  await (await prisma.study).findMany({ select: { id: true } })
                ).map((val) => val.id)
              }

              resolve(decoded)
              return
            }
          } catch (e) {
            reject(e)
            return
          }
        }
      })
    })
  }
  return Promise.resolve(undefined)
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16)
  const derived = crypto.scryptSync(password, salt, 64)
  return salt.toString('hex') + ':' + derived.toString('hex')
}

export async function verifyPassword(hashedPassword: string, password: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const [salt, key] = hashedPassword.split(':')
    crypto.scrypt(password, Buffer.from(salt, 'hex'), 64, (err, derivedKey) => {
      if (err) reject(err)
      resolve(key === derivedKey.toString('hex'))
    })
  })
}

export function generateToken(user: { userId: number }): string {
  if (!process.env.JWT_SECRET) {
    logger.error({ message: 'JWT_SECRET environment variable not set' })
    throw new UnprocessableError('JWT_SECRET environment variable not set')
  }

  const expiryValue = process.env.JWT_EXPIRY || '1hr'

  const options: jwt.SignOptions = {
    algorithm: 'HS256',
    expiresIn: expiryValue as jwt.SignOptions['expiresIn'],
  }
  // Generate JWT token
  return jwt.sign({ userId: user.userId }, process.env.JWT_SECRET, options)
}
