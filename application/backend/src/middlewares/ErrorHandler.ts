import { Request, Response, NextFunction } from 'express'
import { ValidateError } from 'tsoa'
import { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken'
import { Prisma } from '@prisma/client'
import logger from 'common/src/logger'
import {
  InternalErrorResponse,
  NotFoundErrorResponse,
  PrismaErrorResponse,
  UnauthorizedErrorResponse,
  ValidateErrorResponse,
} from 'common/types/api/errors'

export class NoTokenError extends Error {
  constructor() {
    super('No token provided')
    this.name = 'NoTokenError'
  }
}

export class NotFoundError extends Error {
  details: unknown
  constructor(details?: unknown) {
    super('Not Found')
    this.name = 'NotFoundError'
    this.details = details
  }
}

export class IncorrectPasswordError extends Error {
  constructor() {
    super('Incorrect Password')
    this.name = 'IncorrectPasswordError'
  }
}

export function ErrorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): Response | void {
  // Validation Errors
  if (err instanceof ValidateError) {
    const errorResponse: ValidateErrorResponse = {
      message: 'Validation Failed',
      details: err?.fields,
    }
    logger.error({ ...errorResponse })
    return res.status(422).json(errorResponse)
  }

  // Authorization Errors
  if (
    err instanceof NoTokenError ||
    err instanceof TokenExpiredError ||
    err instanceof JsonWebTokenError ||
    err instanceof IncorrectPasswordError
  ) {
    const errorResponse: UnauthorizedErrorResponse = {
      message: err.message,
    }
    logger.error({ ...errorResponse })
    return res.status(401).json(errorResponse)
  }

  // Handle Prisma Known Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    let status: number = 500
    const error: PrismaErrorResponse = {
      message: err.message,
      code: err.code,
      details: err.meta,
    }

    if (err.code === 'P2002') {
      error.message = `${err.meta?.target} already in use`
    } else if (err.code === 'P2025') {
      error.message = 'Record not found'
      status = 404
    }

    logger.error({ ...error })
    return res.status(status).json(error)
  }

  // Not Found Error
  if (err instanceof NotFoundError) {
    const errorResponse: NotFoundErrorResponse = {
      message: 'Not Found',
    }
    logger.error({ ...errorResponse })
    return res.status(404).json(errorResponse)
  }

  // Default error handling for any other type of error
  if (err instanceof Error) {
    const error: InternalErrorResponse = {
      message: 'Internal Server Error',
      details: err,
    }

    logger.error({ ...error })
    return res.status(500).json(error)
  }

  console.log('ERROR')

  next()
}
