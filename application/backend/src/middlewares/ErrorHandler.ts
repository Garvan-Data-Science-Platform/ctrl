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
  BadRequestErrorResponse,
} from 'common/types/api/errors'

export class NoTokenError extends Error {
  constructor() {
    super('No token provided')
    this.name = 'NoTokenError'
  }
}

export class NotFoundError extends Error {
  message: string
  details: unknown
  constructor(message: string, details?: unknown) {
    super(message)
    this.name = 'NotFoundError'
    this.details = details
    this.message = message
  }
}

export class IncorrectPasswordError extends Error {
  constructor() {
    super('Incorrect Password')
    this.name = 'IncorrectPasswordError'
  }
}

export class IncorrectPermissionsError extends Error {
  details: unknown
  constructor(details?: unknown) {
    super('Incorrect Permissions')
    this.name = 'IncorrectPermissionsError'
    this.details = details
  }
}

export class PasswordResetTokenInvalidError extends Error {
  message: string
  details: unknown
  constructor(message: string, details?: unknown) {
    super(message)
    this.name = 'PasswordResetTokenInvalidError'
    this.message = message
    this.details = details
  }
}

export class FileUploadError extends Error {
  details: unknown
  constructor(message: string, details?: unknown) {
    super(message)
    this.name = 'FileUploadError'
    this.details = details
  }
}

export class BadGatewayError extends Error {
  details: unknown
  constructor(message: string, details?: unknown) {
    super(message)
    this.name = 'BadGatewayError'
    this.details = details
  }
}

export function ErrorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): Response | void {
  console.log(err)
  // Bad Request Errors
  if (err instanceof FileUploadError) {
    const errorResponse: BadRequestErrorResponse = {
      message: err.message,
      details: err,
    }
    return res.status(400).json(errorResponse)
  }

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
    err instanceof IncorrectPasswordError ||
    err instanceof IncorrectPermissionsError
  ) {
    const errorResponse: UnauthorizedErrorResponse = {
      message: err.message,
      details: err,
    }
    logger.error({ ...errorResponse })
    return res.status(401).json(errorResponse)
  }

  // Password Reset Token Errors
  if (err instanceof PasswordResetTokenInvalidError) {
    const errorResponse: UnauthorizedErrorResponse = {
      message: err.message,
      details: err,
    }
    logger.error({ ...errorResponse })
    return res.status(403).json(errorResponse)
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
      message: err.message,
    }
    logger.error({ ...errorResponse })
    return res.status(404).json(errorResponse)
  }

  if (err instanceof BadGatewayError) {
    const errorResponse: BadRequestErrorResponse = {
      message: err.message,
      details: err.details,
    }
    logger.error({ ...errorResponse })
    return res.status(502).json(errorResponse)
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
  next()
}
