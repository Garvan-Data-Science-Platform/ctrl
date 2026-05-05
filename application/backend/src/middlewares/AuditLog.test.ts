import request from 'supertest'
import express, { Request, Response } from 'express'
import { auditLog } from './AuditLog'
import prisma from '../PrismaClient'

jest.mock('../PrismaClient', () => ({
  __esModule: true,
  default: {
    auditLog: {
      create: jest.fn(),
    },
  },
}))

describe('AuditLog Middleware', () => {
  let app: express.Application

  beforeAll(() => {
    app = express() // Isolateed Express app just for this test
    app.use(express.json())
    app.use((req: any, _res, next) => {
      req.user = { userId: 123 } // Dummy test user
      next()
    })

    app.use(auditLog)

    // Dummy endpoint that just echoes back the body
    app.post('/dummy-endpoint', (req: Request, res: Response) => {
      res.status(200).json({ receivedBody: req.body })
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should only obscure sensitive fields', async () => {
    const testPayload = {
      email: 'notsecret@example.com',
      password: 'SuperSecretPassword123!',
      redcapURL: 'https://notsecret.com/123',
      redcapToken: 'SuperSecretToken123',
      otp_code: '321123',
      otp_token: '1234-1234-1234-1234',
      contactUsEmail: 'not@secret.com',
    }

    const response = await request(app).post('/dummy-endpoint').send(testPayload)

    expect(response.status).toBe(200)
    expect(response.body.receivedBody.password).toBe(testPayload.password)
    expect(response.body.receivedBody.redcapToken).toBe(testPayload.redcapToken)

    // Ensure logs are only recorded once (or fail)
    expect(prisma.auditLog.create).toHaveBeenCalledTimes(1)

    const prismaCallArgs = (prisma.auditLog.create as jest.Mock).mock.calls[0][0]
    const savedBody = JSON.parse(prismaCallArgs.data.requestBody)

    // Test that sensitive fields are obscured
    expect(savedBody.password).not.toBe('SuperSecretPassword123!')
    expect(savedBody.password).toBe('***')
    expect(savedBody.redcapToken).toBe('***')
    expect(savedBody.otp_code).toBe('***')
    expect(savedBody.otp_token).toBe('***')

    // Test that non-sensitive fields are visible
    expect(savedBody.email).toBe('notsecret@example.com')
    expect(savedBody.redcapURL).toBe('https://notsecret.com/123')
    expect(savedBody.contactUsEmail).toBe('not@secret.com')
  })
})
