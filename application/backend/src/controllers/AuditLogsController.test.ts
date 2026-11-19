import request from 'supertest'
import { Api } from '../Api'
import prisma from '../PrismaClient'
import { Role } from '@prisma/client'
import {
  createIdToken,
  createJwt,
  createOIDCProviderConfig,
  resetDB,
  seedAuditLogs,
} from 'common/testing/TestHelpers'
import { defaultAuditLogsPageSize } from 'common/src/config'
import { generateToken } from '../authentication'
import type { GetAuditLogsResponse } from 'common/types/api/audit-logs'
import { TestUsers, TestStudies, TestOIDC } from 'common/testing/constants'
import { UpdateStudyRequest } from 'common/types/api/studies'
import type {
  LoginRequest,
  OIDCLoginRequest,
  OTPLoginRequest,
  RegisterRequest,
} from 'common/types/api/auth'
import fetchMock from 'fetch-mock'
jest.mock('../config')
import config from '../config'
const api = new Api()
const app = api.app

describe('AuditLogsController', () => {
  let participantToken: string
  let orgAdminToken: string
  let studyAdminToken: string

  const studyName: string = TestStudies.TEST_STUDY.name
  const testStudyId: number = TestStudies.TEST_STUDY.id

  beforeAll(async () => {
    participantToken = await generateToken({ userId: TestUsers.PARTICIPANT_UNANSWERED.id })
    orgAdminToken = await generateToken({ userId: TestUsers.ORG_ADMIN.id })
    studyAdminToken = await generateToken({ userId: TestUsers.STUDY_ADMIN.id })

    api.run()
  })

  beforeEach(async () => {
    await resetDB()
  })

  afterAll(async () => {
    api.stop()
  })

  describe('GET /audit-logs', () => {
    // The newest audit log row, checked to be for the request the test just made
    const latestAuditLog = async (resource: string) => {
      const response = await request(app)
        .get('/audit-logs?sortBy=id&sortDirection=desc')
        .set({ Authorization: `Bearer ${orgAdminToken}` })
      expect(response.status).toBe(200)
      const body: GetAuditLogsResponse = response.body
      expect(body.data[0].resource).toBe(resource)
      return body.data[0]
    }

    // An OTP for the unanswered participant, valid for a minute, with code 1223
    const createOTPToken = () =>
      prisma.oTPToken.create({
        data: {
          code: '1223',
          expiresAt: new Date(new Date().getTime() + 1000 * 60),
          id: 'abc123',
          userId: TestUsers.PARTICIPANT_UNANSWERED.id,
        },
      })

    describe('Authentication and authorisation', () => {
      it('should not allow unauthorised access', async () => {
        const response = await request(app).get('/audit-logs')
        expect(response.status).toBe(401)
      })
      it('should not allow Participants to access', async () => {
        const response = await request(app)
          .get('/audit-logs')
          .set({ Authorization: `Bearer ${participantToken}` })
        expect(response.status).toBe(401)
      })
      it('should allow Organisation Admins to access', async () => {
        const response = await request(app)
          .get('/audit-logs')
          .set({ Authorization: `Bearer ${orgAdminToken}` })
        expect(response.status).toBe(200)
      })
      it('should allow Study Admins to access', async () => {
        const response = await request(app)
          .get('/audit-logs')
          .set({ Authorization: `Bearer ${studyAdminToken}` })
        expect(response.status).toBe(200)
      })
    })

    describe('Default behaviour', () => {
      it('should return default length sorted data and total count when no query params are provided', async () => {
        await seedAuditLogs(55)
        const response = await request(app)
          .get('/audit-logs')
          .set({ Authorization: `Bearer ${studyAdminToken}` })
        expect(response.status).toBe(200)
        const body: GetAuditLogsResponse = response.body
        expect(body).toHaveProperty('data')
        expect(body.data).toHaveLength(defaultAuditLogsPageSize)
        expect(body).toHaveProperty('total')
        expect(body.total).toBe(55)
      })
      it('should handle empty db table gracefully', async () => {
        const response = await request(app)
          .get('/audit-logs')
          .set({ Authorization: `Bearer ${studyAdminToken}` })
        expect(response.status).toBe(200)
        const body: GetAuditLogsResponse = response.body
        expect(body).toHaveProperty('data')
        expect(body.data).toHaveLength(0)
        expect(body).toHaveProperty('total')
        expect(body.total).toBe(0)
      })
      it('should always return accurate total count regardless of _end param', async () => {
        await seedAuditLogs(55)
        const response = await request(app)
          .get(`/audit-logs?_end=${defaultAuditLogsPageSize}`)
          .set({ Authorization: `Bearer ${studyAdminToken}` })
        expect(response.status).toBe(200)
        const body: GetAuditLogsResponse = response.body
        expect(body).toHaveProperty('data')
        expect(body.data).toHaveLength(defaultAuditLogsPageSize)
        expect(body).toHaveProperty('total')
        expect(body.total).toBe(55)
      })
    })

    describe('Pagination', () => {
      it('should accept pagination params and serve correct data', async () => {
        const seedSize = 55
        const start = 5
        const end = 10
        await seedAuditLogs(seedSize)
        const response = await request(app)
          .get(`/audit-logs?_start=${start}&_end=${end}`)
          .set({ Authorization: `Bearer ${studyAdminToken}` })
        expect(response.status).toBe(200)
        const body: GetAuditLogsResponse = response.body
        expect(body).toHaveProperty('data')
        expect(body.data).toHaveLength(end - start)
        expect(body.data[0].id).toBe(1 + start)
        expect(
          body.data[
            start - 1 // account for 0 index
          ].id,
        ).toBe(end)
      })
      it('should handle non-numeric params gracefully', async () => {
        const response = await request(app)
          .get('/audit-logs?_start=foo&_end=bar')
          .set({ Authorization: `Bearer ${studyAdminToken}` })
        expect(response.status).toBe(422)
      })
      it('should handle negative params gracefully', async () => {
        const responseNegativeStart = await request(app)
          .get('/audit-logs?_start=-10&_end=20')
          .set({ Authorization: `Bearer ${studyAdminToken}` })
        expect(responseNegativeStart.status).toBe(422)
        const responseNegativeEnd = await request(app)
          .get('/audit-logs?_start=10&_end=-20')
          .set({ Authorization: `Bearer ${studyAdminToken}` })
        expect(responseNegativeEnd.status).toBe(422)
      })
      it('should handle reversed bounds (_end < _start) gracefully', async () => {
        const response = await request(app)
          .get('/audit-logs?_start=30&_end=10')
          .set({ Authorization: `Bearer ${studyAdminToken}` })
        expect(response.status).toBe(422)
      })
      it('should return an empty array if _start is greater than total number of records', async () => {
        const seedSize = 5
        await seedAuditLogs(seedSize)
        const response = await request(app)
          .get('/audit-logs?_start=50&_end=100')
          .set({ Authorization: `Bearer ${studyAdminToken}` })
        expect(response.status).toBe(200)
        const body: GetAuditLogsResponse = response.body
        expect(body).toHaveProperty('data')
        expect(body.data).toHaveLength(0)
        expect(body).toHaveProperty('total')
        expect(body.total).toBe(seedSize)
      })
    })

    describe('Sorting', () => {
      it('should accept sortDirection asc', async () => {
        const seedSize = 5
        await seedAuditLogs(seedSize)
        const response = await request(app)
          .get('/audit-logs?sortBy=id&sortDirection=asc')
          .set({ Authorization: `Bearer ${studyAdminToken}` })
        expect(response.status).toBe(200)
        const body: GetAuditLogsResponse = response.body
        expect(body).toHaveProperty('data')
        expect(body.data[0].id).toBe(1)
      })
      it('should accept sortDirection desc', async () => {
        const seedSize = 5
        await seedAuditLogs(seedSize)
        const response = await request(app)
          .get('/audit-logs?sortBy=id&sortDirection=desc')
          .set({ Authorization: `Bearer ${studyAdminToken}` })
        expect(response.status).toBe(200)
        const body: GetAuditLogsResponse = response.body
        expect(body).toHaveProperty('data')
        expect(body.data[0].id).toBe(seedSize)
      })
      it('should accept sorting params and handle errors (incorrect field)', async () => {
        const seedSize = 5
        await seedAuditLogs(seedSize)
        const response = await request(app)
          .get('/audit-logs?sortBy=totallyFakeField')
          .set({ Authorization: `Bearer ${studyAdminToken}` })
        expect(response.status).toBe(422)
      })
    })

    describe('Param combinations', () => {
      it('should accept combinations of sorting and pagination params and apply them', async () => {
        const seedSize = 55
        const start = 5
        const end = 10
        await seedAuditLogs(seedSize)
        const response = await request(app)
          .get(`/audit-logs?_start=${start}&_end=${end}&sortBy=id&sortDirection=desc`)
          .set({ Authorization: `Bearer ${studyAdminToken}` })
        expect(response.status).toBe(200)
        const body: GetAuditLogsResponse = response.body
        expect(body).toHaveProperty('data')
        expect(body.data).toHaveLength(end - start)
        expect(body.data[0].id).toBe(seedSize - start)
        expect(
          body.data[
            start - 1 // account for 0 index
          ].id,
        ).toBe(seedSize - end + 1) // account for 0 index
      })
    })

    describe('Sensitive information', () => {
      it('should not show sensitive token information in payloads', async () => {
        // Update a redcapToken
        // Check test study exists
        const existingStudy = await prisma.study.findFirst({
          where: { name: studyName },
        })

        expect(existingStudy?.name).toBe(studyName)

        const updatedRedcapToken = 'SuperSecretTokenInfo'

        const patchResponse = await request(app)
          .patch(`/studies/${testStudyId}`)
          .set({ Authorization: `Bearer ${orgAdminToken}` })
          .send({ redcapToken: updatedRedcapToken } as UpdateStudyRequest)
        expect(patchResponse.status).toBe(204)

        // Check Audit Logs
        const response = await request(app)
          .get('/audit-logs?sortBy=id&sortDirection=desc')
          .set({ Authorization: `Bearer ${studyAdminToken}` })
        expect(response.status).toBe(200)
        const body: GetAuditLogsResponse = response.body
        expect(body).toHaveProperty('data')
        expect(body.data[0].requestBody).not.toContain(updatedRedcapToken)
      })

      it('should obscure sensitive token information in payloads', async () => {
        // Update a redcapToken
        // Check test study exists
        const existingStudy = await prisma.study.findFirst({
          where: { name: studyName },
        })

        expect(existingStudy?.name).toBe(studyName)

        const updatedRedcapToken = 'SuperSecretTokenInfo'
        const obscuredRedcapToken = '\"redcapToken\":\"***\"' // eslint-disable-line no-useless-escape
        const patchResponse = await request(app)
          .patch(`/studies/${testStudyId}`)
          .set({ Authorization: `Bearer ${orgAdminToken}` })
          .send({ redcapToken: updatedRedcapToken } as UpdateStudyRequest)
        expect(patchResponse.status).toBe(204)

        // Check Audit Logs
        const response = await request(app)
          .get('/audit-logs?sortBy=id&sortDirection=desc')
          .set({ Authorization: `Bearer ${studyAdminToken}` })
        expect(response.status).toBe(200)
        const body: GetAuditLogsResponse = response.body
        expect(body).toHaveProperty('data')
        expect(body.data[0].requestBody).toContain(obscuredRedcapToken)
      })

      it('should obscure sensitive password information in payloads', async () => {
        // Register a user
        const registerRequest: RegisterRequest = {
          email: 'johndoe@example.com',
          firstName: 'John',
          lastName: 'Doe',
          password: 'Loginforbogusperson1',
          role: Role.Participant,
        }

        const postResponse = await request(app)
          .post('/auth/register')
          .set({ Authorization: `Bearer ${orgAdminToken}` })
          .send(registerRequest)
        expect(postResponse.status).toEqual(201)

        const obscuredPassword = '\"password\":\"***\"' // eslint-disable-line no-useless-escape
        const safeEmail = '\"email\":\"johndoe@example.com\"' // eslint-disable-line no-useless-escape

        // Check Audit Logs
        const response = await request(app)
          .get('/audit-logs?sortBy=id&sortDirection=desc')
          .set({ Authorization: `Bearer ${studyAdminToken}` })
        expect(response.status).toBe(200)
        const body: GetAuditLogsResponse = response.body
        expect(body).toHaveProperty('data')
        expect(body.data[0].requestBody).toContain(obscuredPassword)
        expect(body.data[0].requestBody).toContain(safeEmail)
      })

      it('should obscure sensitive otp information in payloads', async () => {
        await createOTPToken()
        const loginRequest: OTPLoginRequest = {
          otp_code: '1223',
          otp_token: 'abc123',
        }
        const loginResponse = await request(app).post('/auth/login/otp').send(loginRequest)
        expect(loginResponse.ok).toBe(true)

        const obscuredCode = '\"otp_code\":\"***\"' // eslint-disable-line no-useless-escape
        const obscuredToken = '\"otp_token\":\"***\"' // eslint-disable-line no-useless-escape

        // Check Audit Logs
        const response = await request(app)
          .get('/audit-logs?sortBy=id&sortDirection=desc')
          .set({ Authorization: `Bearer ${studyAdminToken}` })
        expect(response.status).toBe(200)
        const body: GetAuditLogsResponse = response.body
        expect(body).toHaveProperty('data')
        expect(body.data[0].requestBody).toContain(obscuredCode)
        expect(body.data[0].requestBody).toContain(obscuredToken)
      })
    })

    describe('OIDC logins', () => {
      const { ACR, INSTITUTIONS, PROVIDER } = TestOIDC
      const loginRequest: OIDCLoginRequest = {
        code: '123',
        provider: PROVIDER.name,
        redirect_uri: 'redirect',
      }
      const mfaWarning = { auditLogMfaWarning: { acrValues: [ACR.REFEDS_MFA] } }

      const mockOIDCProvider = (tokenResponse: Record<string, unknown>, email: string) => {
        fetchMock.removeRoutes()
        fetchMock
          .mockGlobal()
          .route(`${PROVIDER.providerUrl}/.well-known/openid-configuration`, {
            issuer: PROVIDER.providerUrl,
            token_endpoint: 'http://token',
            userinfo_endpoint: 'http://userinfo',
          })
          .route('http://token', tokenResponse)
          .route('http://userinfo', { email })
      }

      afterEach(() => {
        jest.restoreAllMocks()
      })

      it('should record the provider, user, institution and MFA signal', async () => {
        jest.replaceProperty(config, 'oidc', [createOIDCProviderConfig(mfaWarning)])
        const claims = { acr: ACR.REFEDS_MFA, auth_time: 1800000000, ...INSTITUTIONS.WITH_MFA }
        mockOIDCProvider(
          { access_token: '123', id_token: createIdToken(claims) },
          TestUsers.ORG_ADMIN.email,
        )

        const loginResponse = await request(app).post('/auth/login/oidc').send(loginRequest)
        expect(loginResponse.status).toBe(200)

        const auditLog = await latestAuditLog('auth/login/oidc')
        expect(auditLog.success).toBe(true)
        expect(auditLog.userId).toBe(TestUsers.ORG_ADMIN.id)
        expect(auditLog.meta).toHaveProperty('oidc', {
          provider: PROVIDER.name,
          claims,
          mfaSignal: true,
        })
      })

      it('should flag a login without the MFA signal and still log the user in', async () => {
        jest.replaceProperty(config, 'oidc', [createOIDCProviderConfig(mfaWarning)])
        mockOIDCProvider(
          { access_token: '123', id_token: createIdToken({ acr: ACR.PASSWORD_ONLY }) },
          TestUsers.ORG_ADMIN.email,
        )

        const loginResponse = await request(app).post('/auth/login/oidc').send(loginRequest)
        expect(loginResponse.status).toBe(200)

        const auditLog = await latestAuditLog('auth/login/oidc')
        expect(auditLog.meta).toHaveProperty('oidc', {
          provider: PROVIDER.name,
          claims: { acr: ACR.PASSWORD_ONLY },
          mfaSignal: false,
        })
      })

      it('should record claims without an MFA result when the provider has no MFA warning', async () => {
        jest.replaceProperty(config, 'oidc', [createOIDCProviderConfig()])
        mockOIDCProvider(
          { access_token: '123', id_token: createIdToken({ amr: ['mfa'] }) },
          TestUsers.ORG_ADMIN.email,
        )

        const loginResponse = await request(app).post('/auth/login/oidc').send(loginRequest)
        expect(loginResponse.status).toBe(200)

        const auditLog = await latestAuditLog('auth/login/oidc')
        expect(auditLog.meta).toHaveProperty('oidc', {
          provider: PROVIDER.name,
          claims: { amr: ['mfa'] },
        })
      })

      it('should leave the claims out when the provider turns them off', async () => {
        jest.replaceProperty(config, 'oidc', [
          createOIDCProviderConfig({ ...mfaWarning, auditLogClaims: false }),
        ])
        mockOIDCProvider(
          {
            access_token: '123',
            id_token: createIdToken({ acr: ACR.REFEDS_MFA, ...INSTITUTIONS.WITH_MFA }),
          },
          TestUsers.ORG_ADMIN.email,
        )

        const loginResponse = await request(app).post('/auth/login/oidc').send(loginRequest)
        expect(loginResponse.status).toBe(200)

        const auditLog = await latestAuditLog('auth/login/oidc')
        expect(auditLog.userId).toBe(TestUsers.ORG_ADMIN.id)
        expect(auditLog.meta).toHaveProperty('oidc', { provider: PROVIDER.name, mfaSignal: true })
      })

      it('should record why there are no claims, and no MFA result, when the ID token is missing', async () => {
        jest.replaceProperty(config, 'oidc', [createOIDCProviderConfig(mfaWarning)])
        mockOIDCProvider({ access_token: '123' }, TestUsers.ORG_ADMIN.email)

        const loginResponse = await request(app).post('/auth/login/oidc').send(loginRequest)
        expect(loginResponse.status).toBe(200)

        const auditLog = await latestAuditLog('auth/login/oidc')
        expect(auditLog.meta).toHaveProperty('oidc', {
          provider: PROVIDER.name,
          claimsError: 'no ID token in the token response',
        })
      })

      it('should still log the user in when the ID token cannot be read', async () => {
        jest.replaceProperty(config, 'oidc', [createOIDCProviderConfig(mfaWarning)])
        mockOIDCProvider(
          { access_token: '123', id_token: createJwt('not json') },
          TestUsers.ORG_ADMIN.email,
        )

        const loginResponse = await request(app).post('/auth/login/oidc').send(loginRequest)
        expect(loginResponse.status).toBe(200)

        const auditLog = await latestAuditLog('auth/login/oidc')
        expect(auditLog.meta).toHaveProperty('oidc', {
          provider: PROVIDER.name,
          claimsError: 'ID token is not a valid JWT',
        })
      })

      it('should not record claims from an ID token issued to another client', async () => {
        jest.replaceProperty(config, 'oidc', [createOIDCProviderConfig()])
        mockOIDCProvider(
          {
            access_token: '123',
            id_token: createIdToken({ aud: 'other-client', acr: ACR.REFEDS_MFA }),
          },
          TestUsers.ORG_ADMIN.email,
        )

        const loginResponse = await request(app).post('/auth/login/oidc').send(loginRequest)
        expect(loginResponse.status).toBe(200)

        const auditLog = await latestAuditLog('auth/login/oidc')
        expect(auditLog.meta).toHaveProperty('oidc', {
          provider: PROVIDER.name,
          claimsError: 'ID token audience does not include this client',
        })
      })

      it('should record the provider of a failed login from an unregistered email', async () => {
        jest.replaceProperty(config, 'oidc', [createOIDCProviderConfig()])
        mockOIDCProvider(
          { access_token: '123', id_token: createIdToken({ acr: ACR.REFEDS_MFA }) },
          TestUsers.UNREGISTERED.email,
        )

        const loginResponse = await request(app).post('/auth/login/oidc').send(loginRequest)
        expect(loginResponse.status).toBe(401)

        const auditLog = await latestAuditLog('auth/login/oidc')
        expect(auditLog.success).toBe(false)
        expect(auditLog.userId).toBeNull()
        expect(auditLog.meta).toHaveProperty('oidc', {
          provider: PROVIDER.name,
          claims: { acr: ACR.REFEDS_MFA },
        })
      })

      it('should record the user of a participant rejected by the admin portal', async () => {
        jest.replaceProperty(config, 'oidc', [createOIDCProviderConfig()])
        mockOIDCProvider(
          { access_token: '123', id_token: createIdToken() },
          TestUsers.PARTICIPANT_UNANSWERED.email,
        )

        const loginResponse = await request(app)
          .post('/auth/login/oidc')
          .set({ 'x-client-type': 'admin-client' })
          .send(loginRequest)
        expect(loginResponse.status).toBe(401)

        const auditLog = await latestAuditLog('auth/login/oidc')
        expect(auditLog.success).toBe(false)
        expect(auditLog.userId).toBe(TestUsers.PARTICIPANT_UNANSWERED.id)
      })

      it('should keep personal claims from the ID token out of the audit log', async () => {
        jest.replaceProperty(config, 'oidc', [createOIDCProviderConfig()])
        mockOIDCProvider(
          {
            access_token: '123',
            id_token: createIdToken({
              email: TestUsers.ORG_ADMIN.email,
              name: 'Jane Citizen',
              'https://example.org/upstream': 'upstream profile',
            }),
          },
          TestUsers.ORG_ADMIN.email,
        )

        const loginResponse = await request(app).post('/auth/login/oidc').send(loginRequest)
        expect(loginResponse.status).toBe(200)

        const auditLog = await latestAuditLog('auth/login/oidc')
        expect(auditLog.meta).toEqual({
          resourceId: '',
          url: '/auth/login/oidc',
          method: 'POST',
          oidc: { provider: PROVIDER.name, claims: {} },
        })
      })

      it('should obscure the one-time login code in payloads', async () => {
        jest.replaceProperty(config, 'oidc', [createOIDCProviderConfig()])
        mockOIDCProvider(
          { access_token: '123', id_token: createIdToken() },
          TestUsers.ORG_ADMIN.email,
        )

        const loginResponse = await request(app).post('/auth/login/oidc').send(loginRequest)
        expect(loginResponse.status).toBe(200)

        const auditLog = await latestAuditLog('auth/login/oidc')
        expect(auditLog.requestBody).toContain('"code":"***"')
        expect(auditLog.requestBody).toContain(`"provider":"${PROVIDER.name}"`)
      })
    })

    describe('Password and OTP logins', () => {
      it('should record the user of a password login', async () => {
        const loginRequest: LoginRequest = {
          email: TestUsers.ORG_ADMIN.email,
          password: TestUsers.ORG_ADMIN.password,
        }

        const loginResponse = await request(app)
          .post('/auth/login')
          .set({ 'x-client-type': 'admin-client' })
          .send(loginRequest)
        expect(loginResponse.status).toBe(200)

        const auditLog = await latestAuditLog('auth/login')
        expect(auditLog.success).toBe(true)
        expect(auditLog.userId).toBe(TestUsers.ORG_ADMIN.id)
      })

      it('should record the user of a failed password login', async () => {
        const loginRequest: LoginRequest = {
          email: TestUsers.ORG_ADMIN.email,
          password: 'Wrongpassword1',
        }

        const loginResponse = await request(app)
          .post('/auth/login')
          .set({ 'x-client-type': 'admin-client' })
          .send(loginRequest)
        expect(loginResponse.status).toBe(401)

        const auditLog = await latestAuditLog('auth/login')
        expect(auditLog.success).toBe(false)
        expect(auditLog.userId).toBe(TestUsers.ORG_ADMIN.id)
      })

      it('should not record a user for a login with an unregistered email', async () => {
        const loginRequest: LoginRequest = {
          email: TestUsers.UNREGISTERED.email,
          password: TestUsers.ORG_ADMIN.password,
        }

        const loginResponse = await request(app)
          .post('/auth/login')
          .set({ 'x-client-type': 'admin-client' })
          .send(loginRequest)
        expect(loginResponse.status).toBe(401)

        const auditLog = await latestAuditLog('auth/login')
        expect(auditLog.success).toBe(false)
        expect(auditLog.userId).toBeNull()
      })

      it('should record the user of an OTP login', async () => {
        await createOTPToken()
        const loginRequest: OTPLoginRequest = {
          otp_code: '1223',
          otp_token: 'abc123',
        }

        const loginResponse = await request(app).post('/auth/login/otp').send(loginRequest)
        expect(loginResponse.ok).toBe(true)

        const auditLog = await latestAuditLog('auth/login/otp')
        expect(auditLog.success).toBe(true)
        expect(auditLog.userId).toBe(TestUsers.PARTICIPANT_UNANSWERED.id)
      })

      it('should record the user of a failed OTP login', async () => {
        await createOTPToken()
        const loginRequest: OTPLoginRequest = {
          otp_code: '9999',
          otp_token: 'abc123',
        }

        const loginResponse = await request(app).post('/auth/login/otp').send(loginRequest)
        expect(loginResponse.status).toBe(401)

        const auditLog = await latestAuditLog('auth/login/otp')
        expect(auditLog.success).toBe(false)
        expect(auditLog.userId).toBe(TestUsers.PARTICIPANT_UNANSWERED.id)
      })
    })
  })
})
