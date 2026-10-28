import { Request, Response, NextFunction } from 'express'
import { ValidateError } from 'tsoa'
import { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken'
import { Prisma } from '@prisma/client'
import logger from 'common/src/logger'
import multer from 'multer'
import {
  InternalErrorResponse,
  NotFoundErrorResponse,
  PrismaErrorResponse,
  UnauthorizedErrorResponse,
  ValidateErrorResponse,
  BadRequestErrorResponse,
  UnprocessableErrorResponse,
} from 'common/types/api/errors'

// Fixed text for unique constraint violations. It tells the user what went wrong without naming
// the model or columns that Prisma reports. User's only unique fields hold the email.
export const EMAIL_CONFLICT_MESSAGE = 'Email already exists'
export const CONFLICT_MESSAGE = 'Already exists'

type PrismaError =
  | Prisma.PrismaClientKnownRequestError
  | Prisma.PrismaClientUnknownRequestError
  | Prisma.PrismaClientValidationError
  | Prisma.PrismaClientRustPanicError
  | Prisma.PrismaClientInitializationError

function isPrismaError(err: unknown): err is PrismaError {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError ||
    err instanceof Prisma.PrismaClientUnknownRequestError ||
    err instanceof Prisma.PrismaClientValidationError ||
    err instanceof Prisma.PrismaClientRustPanicError ||
    err instanceof Prisma.PrismaClientInitializationError
  )
}

// Thrown by express.json() for a body that isn't valid JSON
function isJsonParseError(err: unknown): err is SyntaxError {
  return err instanceof SyntaxError && 'type' in err && err.type === 'entity.parse.failed'
}

// http-errors thrown by express.json() for other bad bodies: 413 over the size limit, 415 for an
// unsupported charset, 400 for an aborted request. Their messages never quote the body.
function isExposedClientError(err: unknown): err is Error & { status: number } {
  return (
    err instanceof Error &&
    'expose' in err &&
    err.expose === true &&
    'status' in err &&
    typeof err.status === 'number' &&
    err.status >= 400 &&
    err.status < 500
  )
}

// A stack starts with the error's message, so keep only the frames, which say where it came from
function stackFrames(err: Error) {
  return err.stack?.split('\n').filter((line) => /^\s+at /.test(line))
}

// Prisma's messages quote the failed query, including the values the client sent, so only the
// error's name, identifiers and stack frames are safe to log. A JSON parse error holds the raw
// request in body and can quote part of it in message, so neither is logged. Other errors are
// logged as they are.
function errorForLog(err: unknown) {
  if (isJsonParseError(err)) {
    return { name: err.name, type: 'entity.parse.failed' }
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return {
      name: err.name,
      code: err.code,
      modelName: err.meta?.modelName,
      target: err.meta?.target,
      stack: stackFrames(err),
    }
  }
  if (isPrismaError(err)) {
    return { name: err.name, stack: stackFrames(err) }
  }
  return err
}

export class NoTokenError extends Error {
  constructor() {
    super('No token provided')
    this.name = 'NoTokenError'
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'Unauthorized'
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

export class InvalidCredentialsError extends Error {
  details: unknown
  constructor(details?: unknown) {
    super('Invalid credentials')
    this.name = 'InvalidCredentialsError'
    this.details = details
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

export class UnprocessableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UnprocessableError'
  }
}

export function ErrorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): Response | void {
  console.log(errorForLog(err))
  // Bad Request Errors
  if (err instanceof FileUploadError) {
    const errorResponse: BadRequestErrorResponse = {
      message: err.message,
      details: err,
    }
    return res.status(400).json(errorResponse)
  }

  // Body that isn't valid JSON. A fixed message, because the parser's own can quote the request.
  if (isJsonParseError(err)) {
    const errorResponse: BadRequestErrorResponse = { message: 'Invalid JSON' }
    logger.error({ ...errorResponse, error: errorForLog(err) })
    return res.status(400).json(errorResponse)
  }

  // Other bodies express.json() rejects keep their own status. This comes after the parse error
  // above, which is also exposed but can quote the body. The reason goes in details, as for multer.
  if (isExposedClientError(err)) {
    const errorResponse: BadRequestErrorResponse = {
      message: 'Request body rejected',
      details: err.message,
    }
    logger.error({ ...errorResponse })
    return res.status(err.status).json(errorResponse)
  }

  // Validation Errors
  if (err instanceof ValidateError) {
    const sanitisedDetails: Record<string, { message: string }> = {}
    for (const [field] of Object.entries(err.fields)) {
      sanitisedDetails[field] = {
        message: 'Invalid value provided',
      }
    }
    const errorResponse: ValidateErrorResponse = {
      message: 'Validation Failed',
      details: sanitisedDetails,
    }
    logger.error({ ...errorResponse })
    return res.status(422).json(errorResponse)
  }

  // Authorization Errors
  if (
    err instanceof NoTokenError ||
    err instanceof TokenExpiredError ||
    err instanceof JsonWebTokenError ||
    err instanceof InvalidCredentialsError ||
    err instanceof IncorrectPermissionsError ||
    err instanceof UnauthorizedError
  ) {
    const errorResponse: UnauthorizedErrorResponse = {
      message: err.message,
      //@ts-ignore
      details: err.details || '',
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

  // Prisma errors: never send Prisma's message or meta, which quote the query and its values
  if (isPrismaError(err)) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      // modelName is the model of the query called (prisma.user.*), not the table that clashed. It
      // means the email only while no user.* query also creates rows in a table with a unique column.
      const conflictMessage =
        err.meta?.modelName === Prisma.ModelName.User ? EMAIL_CONFLICT_MESSAGE : CONFLICT_MESSAGE
      // The participant portal shows message and the admin portal shows details, so both carry it
      const errorResponse: PrismaErrorResponse = {
        message: conflictMessage,
        code: err.code,
        details: conflictMessage,
      }
      logger.error({ ...errorResponse, error: errorForLog(err) })
      return res.status(409).json(errorResponse)
    }

    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      const errorResponse: PrismaErrorResponse = { message: 'Record not found', code: err.code }
      logger.error({ ...errorResponse, error: errorForLog(err) })
      return res.status(404).json(errorResponse)
    }

    const errorResponse: InternalErrorResponse = { message: 'Internal Server Error' }
    logger.error({ ...errorResponse, error: errorForLog(err) })
    return res.status(500).json(errorResponse)
  }

  // Upload rejected by multer, e.g. a file over the size limit
  if (err instanceof multer.MulterError) {
    const errorResponse: BadRequestErrorResponse = {
      message: 'File upload failed',
      details: err.message,
    }
    logger.error({ ...errorResponse })
    return res.status(400).json(errorResponse)
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

  // Unprocessable Errors
  if (err instanceof UnprocessableError) {
    const error: UnprocessableErrorResponse = {
      message: 'Unprocessable Content',
      details: err.message,
    }

    logger.error({ ...error })
    return res.status(422).json(error)
  }

  // Default error handling for any other type of error. The message stays in the server logs only,
  // because it may come from a library and describe internals.
  if (err instanceof Error) {
    const errorResponse: InternalErrorResponse = { message: 'Internal Server Error' }
    logger.error({
      ...errorResponse,
      error: { name: err.name, message: err.message, stack: err.stack },
    })
    return res.status(500).json(errorResponse)
  }
  next()
}
