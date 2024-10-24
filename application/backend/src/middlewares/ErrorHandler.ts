import { Request, Response, NextFunction } from 'express'
import { ValidateError } from 'tsoa'
import { NoTokenError } from '../authentication'
import { TokenExpiredError } from 'jsonwebtoken'
import { Prisma } from '@prisma/client'
import logger from 'common/src/logger'

export function ErrorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): Response | void {
  // Validation Errors
  if (err instanceof ValidateError) {
    const errorResponse = {
      message: 'Validation Failed',
      details: err?.fields,
    }
    logger.error({ ...errorResponse })
    return res.status(422).json(errorResponse)
  }

  // Token Errors
  if (err instanceof NoTokenError) {
    const error = {
      message: 'No token provided',
    }
    logger.error({ ...error })
    return res.status(401).json(error)
  }

  if (err instanceof TokenExpiredError) {
    const error = {
      message: 'Token has expired',
    }
    logger.error({ ...error })
    return res.status(401).json(error)
  }

  // Prisma Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const error = {
      message: err.message,
      code: err.code,
      details: err.meta,
    }

    if (err.code === 'P2002') {
      error.message = `${err.meta?.target} already in use`
    } else if (err.code === 'P2025') {
      error.message = 'Record does not exist'
    }

    logger.error({ ...error })
    return res.status(500).json(error)
  }

  // Default error handling for any other type of error
  if (err instanceof Error) {
    const error = {
      message: err.message,
      error: err,
    }
    logger.error({ ...error })
    return res.status(500).json(error)
  }

  next()
}
