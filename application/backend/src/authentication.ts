/* eslint-disable @typescript-eslint/no-explicit-any */
import * as express from 'express'
import * as jwt from 'jsonwebtoken'
import logger from 'common/src/logger'
import * as crypto from 'crypto'
import { NoTokenError, IncorrectPermissionsError } from './middlewares/ErrorHandler'

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
        throw new Error('JWT_SECRET environment variable not set')
      }

      jwt.verify(token, process.env.JWT_SECRET, function (err: any, decoded: any) {
        if (err) {
          reject(err)
        } else {
          if (scopes) {
            // Check if JWT contains all required scopes
            let scope: string
            for (scope of scopes) {
              if (!decoded.scopes.includes(scope)) {
                reject(
                  new IncorrectPermissionsError({
                    message: 'JWT does not contain required scope.',
                    scopes,
                  }),
                )
                return
              }
            }
            resolve(decoded)
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

export function generateToken(user: { userId: number; roles: string[] }): string {
  if (!process.env.JWT_SECRET) {
    logger.error({ message: 'JWT_SECRET environment variable not set' })
    throw new Error('JWT_SECRET environment variable not set')
  }

  const expiryValue = process.env.JWT_EXPIRY || '1hr'

  const options: jwt.SignOptions = {
    algorithm: 'HS256',
    expiresIn: expiryValue as jwt.SignOptions['expiresIn'],
  }
  // Generate JWT token
  return jwt.sign({ userId: user.userId, scopes: user.roles }, process.env.JWT_SECRET, options)
}
