/* eslint-disable @typescript-eslint/no-explicit-any */
import * as express from 'express'
import * as jwt from 'jsonwebtoken'
import logger from 'common/src/logger'

export class NoTokenError extends Error {
  constructor() {
    super('No token provided')
    this.name = 'NoTokenError'
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
                reject(new Error('JWT does not contain required scope.'))
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

export function getUserIdFromToken(token: string): number {
  const decoded = jwt.decode(token) as jwt.JwtPayload | null

  if (decoded && typeof decoded === 'object' && 'userId' in decoded) {
    return decoded.userId as number
  }

  throw new Error('UserID not encoded in token.')
}
