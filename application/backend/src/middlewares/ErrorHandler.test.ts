import request from 'supertest'
import express, { NextFunction, Request, Response } from 'express'
import multer from 'multer'
import { inspect } from 'util'
import { Prisma } from '@prisma/client'
import { ValidateError } from 'tsoa'
import logger from 'common/src/logger'
import {
  BadGatewayError,
  CONFLICT_MESSAGE,
  EMAIL_CONFLICT_MESSAGE,
  ErrorHandler,
  FileUploadError,
  IncorrectPermissionsError,
  InvalidCredentialsError,
  NoTokenError,
  NotFoundError,
  PasswordResetTokenInvalidError,
  UnauthorizedError,
  UnprocessableError,
} from './ErrorHandler'

// Stands in for anything a client submitted. It must never reach a response or a log.
const PLANTED_SECRET = 'PlantedSecret-971'
const CLIENT_VERSION = '5.22.0'
// Multi-line like a real Prisma message, which quotes the query arguments on their own lines
const prismaMessage = `\nInvalid \`prisma.user.update()\` invocation:\n  data: {\n    password: "${PLANTED_SECRET}"\n  }`

// Isolated app whose only route passes the given value to the error handler.
const appThatFailsWith = (err: unknown) => {
  const app = express()
  app.get('/fail', (_req: Request, _res: Response, next: NextFunction) => next(err))
  app.use(ErrorHandler)
  return app
}

describe('ErrorHandler', () => {
  let consoleLog: jest.SpyInstance
  let loggerError: jest.SpyInstance

  // util.inspect, unlike JSON.stringify, includes an Error's message and stack.
  const everythingLogged = () =>
    inspect([...consoleLog.mock.calls, ...loggerError.mock.calls], { depth: null })

  beforeEach(() => {
    consoleLog = jest.spyOn(console, 'log').mockImplementation(() => undefined)
    loggerError = jest.spyOn(logger, 'error').mockImplementation(() => logger)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Prisma errors', () => {
    it('should return a 409 with fixed text for a unique constraint violation on a user email', async () => {
      const err = new Prisma.PrismaClientKnownRequestError(prismaMessage, {
        code: 'P2002',
        clientVersion: CLIENT_VERSION,
        meta: { modelName: 'User', target: ['emailHash'] },
      })
      const response = await request(appThatFailsWith(err)).get('/fail')

      expect(response.status).toBe(409)
      expect(response.body).toEqual({
        message: EMAIL_CONFLICT_MESSAGE,
        code: 'P2002',
        details: EMAIL_CONFLICT_MESSAGE,
      })
      expect(response.text).not.toContain('emailHash')
      expect(response.text).not.toContain(PLANTED_SECRET)
    })

    it('should return a 409 with generic text for a unique constraint violation on another model', async () => {
      const err = new Prisma.PrismaClientKnownRequestError(prismaMessage, {
        code: 'P2002',
        clientVersion: CLIENT_VERSION,
        meta: { modelName: 'Invite', target: ['studyId', 'emailHash'] },
      })
      const response = await request(appThatFailsWith(err)).get('/fail')

      expect(response.status).toBe(409)
      expect(response.body).toEqual({
        message: CONFLICT_MESSAGE,
        code: 'P2002',
        details: CONFLICT_MESSAGE,
      })
      expect(response.text).not.toContain('Invite')
      expect(response.text).not.toContain('emailHash')
    })

    it('should return a 409 with generic text when Prisma does not name the model', async () => {
      const err = new Prisma.PrismaClientKnownRequestError(prismaMessage, {
        code: 'P2002',
        clientVersion: CLIENT_VERSION,
      })
      const response = await request(appThatFailsWith(err)).get('/fail')

      expect(response.status).toBe(409)
      expect(response.body).toEqual({
        message: CONFLICT_MESSAGE,
        code: 'P2002',
        details: CONFLICT_MESSAGE,
      })
    })

    it('should return a 404 without Prisma meta when a record is not found', async () => {
      const err = new Prisma.PrismaClientKnownRequestError(prismaMessage, {
        code: 'P2025',
        clientVersion: CLIENT_VERSION,
        meta: { modelName: 'User', cause: 'Record to update not found.' },
      })
      const response = await request(appThatFailsWith(err)).get('/fail')

      expect(response.status).toBe(404)
      expect(response.body).toEqual({ message: 'Record not found', code: 'P2025' })
    })

    it('should return a plain 500 for any other known request error', async () => {
      const err = new Prisma.PrismaClientKnownRequestError(prismaMessage, {
        code: 'P2003',
        clientVersion: CLIENT_VERSION,
      })
      const response = await request(appThatFailsWith(err)).get('/fail')

      expect(response.status).toBe(500)
      expect(response.body).toEqual({ message: 'Internal Server Error' })
    })

    it('should return a plain 500 for a validation error', async () => {
      const err = new Prisma.PrismaClientValidationError(prismaMessage, {
        clientVersion: CLIENT_VERSION,
      })
      const response = await request(appThatFailsWith(err)).get('/fail')

      expect(response.status).toBe(500)
      expect(response.body).toEqual({ message: 'Internal Server Error' })
    })

    it('should return a plain 500 for an unknown request error', async () => {
      const err = new Prisma.PrismaClientUnknownRequestError(prismaMessage, {
        clientVersion: CLIENT_VERSION,
      })
      const response = await request(appThatFailsWith(err)).get('/fail')

      expect(response.status).toBe(500)
      expect(response.body).toEqual({ message: 'Internal Server Error' })
    })

    it('should return a plain 500 for a Rust panic', async () => {
      const err = new Prisma.PrismaClientRustPanicError(prismaMessage, CLIENT_VERSION)
      const response = await request(appThatFailsWith(err)).get('/fail')

      expect(response.status).toBe(500)
      expect(response.body).toEqual({ message: 'Internal Server Error' })
    })

    it('should return a plain 500 for an initialization error', async () => {
      const err = new Prisma.PrismaClientInitializationError(prismaMessage, CLIENT_VERSION)
      const response = await request(appThatFailsWith(err)).get('/fail')

      expect(response.status).toBe(500)
      expect(response.body).toEqual({ message: 'Internal Server Error' })
    })

    it('should log the error name, code, model and stack frames but never the Prisma message', async () => {
      const knownErr = new Prisma.PrismaClientKnownRequestError(prismaMessage, {
        code: 'P2002',
        clientVersion: CLIENT_VERSION,
        meta: { modelName: 'User', target: ['emailHash'] },
      })
      const validationErr = new Prisma.PrismaClientValidationError(prismaMessage, {
        clientVersion: CLIENT_VERSION,
      })
      await request(appThatFailsWith(knownErr)).get('/fail')
      await request(appThatFailsWith(validationErr)).get('/fail')

      const logged = everythingLogged()
      expect(logged).not.toContain(PLANTED_SECRET)
      expect(logged).toContain('PrismaClientKnownRequestError')
      expect(logged).toContain('P2002')
      expect(logged).toContain('User')
      expect(logged).toContain('PrismaClientValidationError')
      // Frames point at where the error was created, here this test file
      expect(logged).toContain('ErrorHandler.test.ts')
    })
  })

  describe('other errors', () => {
    it('should return a plain 500 for an unexpected error and keep its message in the logs', async () => {
      const response = await request(appThatFailsWith(new Error('Unexpected failure'))).get('/fail')

      expect(response.status).toBe(500)
      expect(response.body).toEqual({ message: 'Internal Server Error' })
      expect(everythingLogged()).toContain('Unexpected failure')
    })

    it('should return a plain 500 for a TypeError and keep its message in the logs', async () => {
      const err = new TypeError("Cannot read properties of undefined (reading 'id')")
      const response = await request(appThatFailsWith(err)).get('/fail')

      expect(response.status).toBe(500)
      expect(response.body).toEqual({ message: 'Internal Server Error' })
      expect(everythingLogged()).toContain("reading 'id'")
    })

    it('should return a 422 with the message of an UnprocessableError', async () => {
      const err = new UnprocessableError('Study with that name already exists')
      const response = await request(appThatFailsWith(err)).get('/fail')

      expect(response.status).toBe(422)
      expect(response.body).toEqual({
        message: 'Unprocessable Content',
        details: 'Study with that name already exists',
      })
    })

    it('should return a 400 with the reason when an upload is rejected', async () => {
      const err = new multer.MulterError('LIMIT_FILE_SIZE', 'file')
      const response = await request(appThatFailsWith(err)).get('/fail')

      expect(response.status).toBe(400)
      expect(response.body).toEqual({ message: 'File upload failed', details: 'File too large' })
    })

    it('should return a 400 without sending or logging a body that is not valid JSON', async () => {
      const app = express()
      app.use(express.json())
      app.post('/fail', (_req: Request, res: Response) => res.sendStatus(200))
      app.use(ErrorHandler)

      const response = await request(app)
        .post('/fail')
        .set('Content-Type', 'application/json')
        .send(`{"password": ${PLANTED_SECRET}}`)

      // The parser's message quotes about ten characters of the body, so check for the prefix
      const secretPrefix = PLANTED_SECRET.slice(0, 10)
      expect(response.status).toBe(400)
      expect(response.body).toEqual({ message: 'Invalid JSON' })
      expect(everythingLogged()).not.toContain(secretPrefix)
    })

    it('should keep the status and reason of other bodies express.json() rejects', async () => {
      const app = express()
      app.use(express.json())
      app.post('/fail', (_req: Request, res: Response) => res.sendStatus(200))
      app.use(ErrorHandler)

      const tooLarge = await request(app)
        .post('/fail')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ data: 'a'.repeat(120 * 1024) }))
      const wrongCharset = await request(app)
        .post('/fail')
        .set('Content-Type', 'application/json; charset=latin1')
        .send('{"a":1}')

      expect(tooLarge.status).toBe(413)
      expect(tooLarge.body).toEqual({
        message: 'Request body rejected',
        details: 'request entity too large',
      })
      expect(wrongCharset.status).toBe(415)
      expect(wrongCharset.body.details).toContain('LATIN1')
    })

    it('should return a 400 for a FileUploadError', async () => {
      const response = await request(appThatFailsWith(new FileUploadError('No file uploaded'))).get(
        '/fail',
      )

      expect(response.status).toBe(400)
      expect(response.body.message).toBe('No file uploaded')
    })

    it('should return a 422 with sanitised fields for a ValidateError', async () => {
      const err = new ValidateError({ 'bodyRequest.password': { message: 'bad', value: 'x' } }, '')
      const response = await request(appThatFailsWith(err)).get('/fail')

      expect(response.status).toBe(422)
      expect(response.body).toEqual({
        message: 'Validation Failed',
        details: { 'bodyRequest.password': { message: 'Invalid value provided' } },
      })
    })

    it('should return a 401 for authorisation errors, with or without details', async () => {
      const withoutDetails = await request(appThatFailsWith(new NoTokenError())).get('/fail')
      const withDetails = await request(
        appThatFailsWith(new InvalidCredentialsError('Invalid credentials provided')),
      ).get('/fail')

      expect(withoutDetails.status).toBe(401)
      expect(withoutDetails.body).toEqual({ message: 'No token provided', details: '' })
      expect(withDetails.status).toBe(401)
      expect(withDetails.body).toEqual({
        message: 'Invalid credentials',
        details: 'Invalid credentials provided',
      })
    })

    it('should return a 401 for unauthorised and incorrect-permission errors', async () => {
      const unauthorised = await request(
        appThatFailsWith(new UnauthorizedError('Elsa API key is invalid or missing')),
      ).get('/fail')
      const noPermission = await request(
        appThatFailsWith(new IncorrectPermissionsError('JWT does not contain required scope.')),
      ).get('/fail')

      expect(unauthorised.status).toBe(401)
      expect(unauthorised.body).toEqual({
        message: 'Elsa API key is invalid or missing',
        details: '',
      })
      expect(noPermission.status).toBe(401)
      expect(noPermission.body).toEqual({
        message: 'Incorrect Permissions',
        details: 'JWT does not contain required scope.',
      })
    })

    it('should return a 403 for an invalid password reset token', async () => {
      const err = new PasswordResetTokenInvalidError('Token expired')
      const response = await request(appThatFailsWith(err)).get('/fail')

      expect(response.status).toBe(403)
      expect(response.body.message).toBe('Token expired')
    })

    it('should return a 404 with the message of a NotFoundError', async () => {
      const response = await request(appThatFailsWith(new NotFoundError('Study not found'))).get(
        '/fail',
      )

      expect(response.status).toBe(404)
      expect(response.body).toEqual({ message: 'Study not found' })
    })

    it('should return a 502 for a BadGatewayError', async () => {
      const err = new BadGatewayError('Error communicating with REDCap API')
      const response = await request(appThatFailsWith(err)).get('/fail')

      expect(response.status).toBe(502)
      expect(response.body.message).toBe('Error communicating with REDCap API')
    })

    it('should pass anything that is not an Error on to the next handler', async () => {
      const response = await request(appThatFailsWith({ reason: 'not an Error' })).get('/fail')

      expect(response.status).toBe(404)
    })
  })
})
