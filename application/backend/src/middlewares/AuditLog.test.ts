import request from 'supertest'
import express, { Request, Response } from 'express'
import { auditLog, getAuditDetails } from './AuditLog'
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

    // Dummy endpoint that adds its own details to the audit log row, like the login routes do
    app.post('/dummy-with-audit', (req: Request, res: Response) => {
      const audit = getAuditDetails(req)
      audit.userId = 456
      audit.meta = { oidc: { provider: 'test', claims: { acr: 'x' }, mfaSignal: false } }
      res.status(200).json({})
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should only obscure sensitive fields', async () => {
    const testPayload = {
      email: 'notsecret@example.com',
      password: 'Supersecret123!',
      newPassword: 'Supersecret321!',
      redcapURL: 'https://notsecret.com/123',
      redcapToken: 'SuperSecretToken123',
      otp_code: '321123',
      otp_token: '1234-1234-1234-1234',
      contactUsEmail: 'not@secret.com',
      token: '1234-1234-1234-1234',
      code: 'one-time-oidc-code',
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
    expect(savedBody.password).not.toBe('Supersecret123!')
    expect(savedBody.password).toBe('***')
    expect(savedBody.newPassword).toBe('***')
    expect(savedBody.redcapToken).toBe('***')
    expect(savedBody.otp_code).toBe('***')
    expect(savedBody.otp_token).toBe('***')
    expect(savedBody.token).toBe('***')
    expect(savedBody.code).toBe('***')

    // Test that non-sensitive fields are visible
    expect(savedBody.email).toBe('notsecret@example.com')
    expect(savedBody.redcapURL).toBe('https://notsecret.com/123')
    expect(savedBody.contactUsEmail).toBe('not@secret.com')
  })

  it('should record only the request details when the route adds nothing', async () => {
    await request(app).post('/dummy-endpoint').send({})

    const { data } = (prisma.auditLog.create as jest.Mock).mock.calls[0][0]
    expect(data.userId).toBe(123)
    expect(data.meta).toEqual({ resourceId: '', url: '/dummy-endpoint', method: 'POST' })
  })

  it("should add the route's own user and details from res.locals.audit", async () => {
    await request(app).post('/dummy-with-audit').send({})

    const { data } = (prisma.auditLog.create as jest.Mock).mock.calls[0][0]
    expect(data.userId).toBe(456)
    expect(data.meta).toEqual({
      resourceId: '',
      url: '/dummy-with-audit',
      method: 'POST',
      oidc: { provider: 'test', claims: { acr: 'x' }, mfaSignal: false },
    })
  })
})
