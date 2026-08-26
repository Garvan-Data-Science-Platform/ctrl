import request from 'supertest'
import { Api } from '../Api'
import type {
  LoginRequest,
  LoginSuccessResponse,
  OIDCLoginRequest,
  OTPLoginRequest,
  RegisterParticipantRequest,
  RegisterParticipantResponse,
  RegisterRequest,
  RegisterResponse,
} from 'common/types/api/auth'
import prisma from '../PrismaClient'
import { Role } from '@prisma/client'
import { resetDB, wipeDB } from 'common/testing/TestHelpers'
import { TestUsers, TestStudies, TestInvites } from 'common/testing/constants'
import {
  ContactMethod,
  ParticipantType,
  StateTerritory,
} from 'common/types/api/users/ParticipantProfile'
import { generateToken } from '../authentication'
import fetchMock from 'fetch-mock'
jest.mock('../config')
import config from '../config'

const api = new Api()
const app = api.app
let orgAdminToken: string

describe('AuthController', () => {
  const testFirstName = 'John'
  const testLastName = 'Doe'
  const testEmail = 'johndoe@example.com'
  const testPassword = 'Lolliesfortests123'
  const testGuardianFirstName = 'Jenny'

  beforeAll(async () => {
    orgAdminToken = await generateToken({
      userId: TestUsers.ORG_ADMIN.id,
    })
    api.run()
  })

  beforeEach(async () => {
    await resetDB()
  })

  afterAll(async () => {
    api.stop()
  })

  describe('POST /auth/register', () => {
    it('should allow access to protected routes', async () => {
      // Try to make a protected route request
      const protectedRouteResponse1 = await request(app).get('/users')

      const getAllUsersBody1 = protectedRouteResponse1.body

      expect(protectedRouteResponse1.status).toEqual(401)
      expect(getAllUsersBody1.message).toEqual('No token provided')
      expect(getAllUsersBody1.data).toBe(undefined)

      const registerRequest: RegisterRequest = {
        firstName: testFirstName,
        lastName: testLastName,
        email: 'testregister@example.com',
        password: testPassword,
        role: Role.OrganisationAdmin,
      }

      // Register user
      const registerResponse = await request(app)
        .post('/auth/register')
        .set({ Authorization: `Bearer ${orgAdminToken}` })
        .send(registerRequest)
      expect(registerResponse.status).toEqual(201)

      const registerBody: RegisterResponse = registerResponse.body

      expect(registerBody.token).not.toBeNull()

      // Add token to protected route request
      const protectedRouteResponse2 = await request(app)
        .get('/users')
        .set({ Authorization: `Bearer ${registerBody.token}` })

      expect(protectedRouteResponse2.status).toEqual(200)
    })

    it('should register a new user returning a token', async () => {
      const registerRequest: RegisterRequest = {
        firstName: testFirstName,
        lastName: testLastName,
        email: testEmail,
        password: testPassword,
        role: Role.Participant,
      }

      // Check if user is already registered
      const existingUser = await prisma.user.findFirst({ where: { email: registerRequest.email } })
      expect(existingUser).toBeNull()

      // Register user
      const response = await request(app)
        .post('/auth/register')
        .set({ Authorization: `Bearer ${orgAdminToken}` })
        .send(registerRequest)
      expect(response.status).toEqual(201)
      const body: RegisterResponse = response.body
      expect(body.token).not.toBeNull()

      // Check if user is now registered
      const registeredUser = await prisma.user.findFirst({
        where: { email: registerRequest.email },
      })
      expect(registeredUser).not.toBeNull()
    })

    it('should return 422 if validation fails', async () => {
      const registerRequest = {
        firstName: testFirstName,
        lastName: testLastName,
        password: 'password123', //Does not meet minimum password requirements
        role: Role.Participant,
      }

      const response = await request(app)
        .post('/auth/register')
        .set({ Authorization: `Bearer ${orgAdminToken}` })
        .send(registerRequest)
      expect(response.status).toEqual(422)

      const body = response.body
      expect(body.message).toBe('Validation Failed')
    })

    it('should return 422 if validation fails on invalid user input', async () => {
      const registerRequest = {
        firstName: "{{7*7}}<script>alert('xss-firstname')</script>",
        lastName: "{{7*7}}<script>alert('xss-lastname')</script>",
        email: "{{7*7}}<script>aliert('xss-email')</script>@email.com",
        password: testPassword,
        role: Role.OrganisationAdmin,
      }

      const response = await request(app)
        .post('/auth/register')
        .set({ Authorization: `Bearer ${orgAdminToken}` })
        .send(registerRequest)
      expect(response.status).toEqual(422)

      const body = response.body
      expect(body.message).toBe('Validation Failed')
      expect(body.details).toEqual({
        'bodyRequest.email': {
          message: 'Invalid value provided',
        },
        'bodyRequest.firstName': {
          message: 'Invalid value provided',
        },
        'bodyRequest.lastName': {
          message: 'Invalid value provided',
        },
      })
    })

    it('should return an error if the user is already registered', async () => {
      const registerRequest: RegisterRequest = {
        firstName: testFirstName,
        lastName: testLastName,
        email: testEmail,
        password: testPassword,
        role: Role.Participant,
      }

      // Register user
      await request(app)
        .post('/auth/register')
        .set({ Authorization: `Bearer ${orgAdminToken}` })
        .send(registerRequest)

      // Try to register again with the same email
      const response = await request(app)
        .post('/auth/register')
        .set({ Authorization: `Bearer ${orgAdminToken}` })
        .send(registerRequest)
      expect(response.status).toEqual(500)
    })

    it('should fail validation if provided with an invalid email', async () => {
      const registerRequest: RegisterRequest = {
        email: 'invalid email',
        firstName: testFirstName,
        lastName: testLastName,
        password: testPassword,
        role: Role.Participant,
      }

      const response = await request(app)
        .post('/auth/register')
        .set({ Authorization: `Bearer ${orgAdminToken}` })
        .send(registerRequest)
      expect(response.status).toEqual(422)

      const body = response.body
      expect(body.message).toBe('Validation Failed')
      expect(body.details).toEqual({
        'bodyRequest.email': {
          message: 'Invalid value provided',
        },
      })
    })

    it('should fail validation if provided with an invalid password', async () => {
      const registerRequest: RegisterRequest = {
        email: testEmail,
        firstName: testFirstName,
        lastName: testLastName,
        password: 'pass',
        role: Role.Participant,
      }

      const response = await request(app)
        .post('/auth/register')
        .set({ Authorization: `Bearer ${orgAdminToken}` })
        .send(registerRequest)
      expect(response.status).toEqual(422)

      const body = response.body
      expect(body.message).toBe('Validation Failed')
      expect(body.details).toEqual({
        'bodyRequest.password': {
          message: 'Invalid value provided',
        },
      })
    })

    it('should fail validation if provided with empty values', async () => {
      const registerRequest: RegisterRequest = {
        email: '',
        firstName: '',
        lastName: '',
        password: '',
        role: Role.Participant,
      }

      const response = await request(app)
        .post('/auth/register')
        .set({ Authorization: `Bearer ${orgAdminToken}` })
        .send(registerRequest)
      expect(response.status).toEqual(422)

      const body = response.body
      expect(body.message).toBe('Validation Failed')
      expect(body.details).toEqual({
        'bodyRequest.firstName': { message: 'Invalid value provided' },
        'bodyRequest.lastName': { message: 'Invalid value provided' },
        'bodyRequest.email': { message: 'Invalid value provided' },
        'bodyRequest.password': { message: 'Invalid value provided' },
      })
    })

    it('should fail validation if the password does not include caps or numbers', async () => {
      const registerRequest: RegisterRequest = {
        firstName: testFirstName,
        lastName: testLastName,
        email: testEmail,
        password: 'nocapsornumber',
        role: Role.Participant,
      }

      const response = await request(app)
        .post('/auth/register')
        .set({ Authorization: `Bearer ${orgAdminToken}` })
        .send(registerRequest)
      expect(response.status).toEqual(422)

      const body = response.body
      expect(body.message).toBe('Validation Failed')
      expect(body.details).toEqual({
        Uppercase: { message: 'Invalid value provided' },
        Number: { message: 'Invalid value provided' },
      })
    })
  })

  describe('POST /auth/register/setup', () => {
    it('Should allow setup registration when db has been wiped', async () => {
      await wipeDB()
      const res = await request(app)
        .post('/auth/register/setup')
        .send({ email: testEmail, password: testPassword })
      expect(res.status).toEqual(201)
      const user = await prisma.user.findFirst({ where: { email: testEmail } })
      expect(user).not.toBeNull()
    })
    it('Should not allow setup registration when a user exists', async () => {
      await resetDB()
      const res = await request(app)
        .post('/auth/register/setup')
        .send({ email: testEmail, password: testPassword })
      expect(res.ok).toBe(false)
    })
  })

  describe('POST /auth/register/participant/{inviteId}', () => {
    const registerParticipantRequestBase: RegisterParticipantRequest = {
      firstName: testFirstName,
      lastName: testLastName,
      email: TestInvites.INVITE_PENDING.email,
      password: testPassword,
      mobile: '0477777777',
      addressLine: '123 Some Street',
      suburb: 'Sydney',
      postcode: '2000',
      state: StateTerritory.NSW,
      preferredContact: ContactMethod.MOBILE,
      dob: '1990-01-01',
      participantType: ParticipantType.STANDARD,
      nextOfKin: { firstName: 'John', lastName: 'Smith', email: 'john@smith.com' },
      dependents: [],
    }

    it('should register a new user returning a token', async () => {
      const participantInviteId = await prisma.invite.findFirstOrThrow({
        where: {
          email: registerParticipantRequestBase.email,
          study: {
            name: TestStudies.TEST_STUDY.name,
          },
        },
      })

      const participantResponse = await request(app)
        .post(`/auth/register/participants/${participantInviteId.id}`)
        .send(registerParticipantRequestBase)
      expect(participantResponse.status).toEqual(201)

      const participantBody: RegisterParticipantResponse = participantResponse.body
      expect(participantBody.token).not.toBeNull()
    })
    it('should fail validation if the password is not strong', async () => {
      const registerParticipantRequest: RegisterParticipantRequest = {
        ...registerParticipantRequestBase,
        password: 'passwordtester',
      }
      const participantInviteId = await prisma.invite.findFirstOrThrow({
        where: {
          email: registerParticipantRequestBase.email,
          studyId: 1,
        },
      })

      const registerParticipantResponse = await request(app)
        .post(`/auth/register/participants/${participantInviteId.id}`)
        .send(registerParticipantRequest)
      expect(registerParticipantResponse.status).toEqual(422)

      const registerParticipantBody = registerParticipantResponse.body
      expect(registerParticipantBody.message).toEqual('Validation Failed')
      expect(registerParticipantBody.token).toBe(undefined)
      expect(registerParticipantBody.details).toEqual({
        Uppercase: { message: 'Invalid value provided' },
        Number: { message: 'Invalid value provided' },
        CommonBase: { message: 'Invalid value provided' },
      })
    })

    it('should fail validation if provided with empty values', async () => {
      const registerParticipantRequest: RegisterParticipantRequest = {
        ...registerParticipantRequestBase,
        lastName: '',
        mobile: '12341234',
      }

      const participantInviteId = await prisma.invite.findFirstOrThrow({
        where: {
          email: registerParticipantRequestBase.email,
          studyId: 1,
        },
      })

      const registerParticipantResponse = await request(app)
        .post(`/auth/register/participants/${participantInviteId.id}`)
        .send(registerParticipantRequest)
      expect(registerParticipantResponse.status).toEqual(422)

      const registerParticipantBody = registerParticipantResponse.body
      expect(registerParticipantBody.message).toEqual('Validation Failed')
      expect(registerParticipantBody.token).toBe(undefined)
      expect(registerParticipantBody.details).toEqual({
        'bodyRequest.lastName': {
          message: 'Invalid value provided',
        },
        'bodyRequest.mobile': {
          message: 'Invalid value provided',
        },
      })
    })

    it('should fail validation if provided with illegal values', async () => {
      const registerParticipantRequest: RegisterParticipantRequest = {
        ...registerParticipantRequestBase,
        firstName: "{{7*7}}<script>alert('xss-firstname')</script>${{7*7}}#{7*7}<%= 7*7 %>",
        lastName: '<script>',
        addressLine: "<script>alert('xss-address')</script>",
        suburb: "<img src=x onerror=alert('xss-suburb-img')>",
        nextOfKin: {
          firstName: 'John{7*7}',
          lastName: '<script>Smith</script>',
          email: '<script>john</script>@smith.com',
        },
      }

      const participantInviteId = await prisma.invite.findFirstOrThrow({
        where: {
          email: registerParticipantRequestBase.email,
          studyId: 1,
        },
      })

      const registerParticipantResponse = await request(app)
        .post(`/auth/register/participants/${participantInviteId.id}`)
        .send(registerParticipantRequest)
      expect(registerParticipantResponse.status).toEqual(422)

      const registerParticipantBody = registerParticipantResponse.body
      expect(registerParticipantBody.message).toEqual('Validation Failed')
      expect(registerParticipantBody.token).toBe(undefined)
      expect(registerParticipantBody.details).toEqual({
        'bodyRequest.firstName': {
          message: 'Invalid value provided',
        },
        'bodyRequest.lastName': {
          message: 'Invalid value provided',
        },
        'bodyRequest.addressLine': {
          message: 'Invalid value provided',
        },
        'bodyRequest.suburb': {
          message: 'Invalid value provided',
        },
        'bodyRequest.nextOfKin.firstName': {
          message: 'Invalid value provided',
        },
        'bodyRequest.nextOfKin.lastName': {
          message: 'Invalid value provided',
        },
        'bodyRequest.nextOfKin.email': {
          message: 'Invalid value provided',
        },
      })
    })

    it('Should add dependent profiles if provided, should have same family id', async () => {
      const registerParticipantRequest: RegisterParticipantRequest = {
        ...registerParticipantRequestBase,
        dependents: [
          { firstName: 'A', lastName: 'B', dob: '2020-01-01', permanent: false },
          { firstName: 'B', lastName: 'B', dob: '2020-01-01', permanent: false },
        ],
      }

      const participantInviteId = await prisma.invite.findFirstOrThrow({
        where: {
          email: registerParticipantRequest.email,
          studyId: 1,
        },
      })

      await request(app)
        .post(`/auth/register/participants/${participantInviteId.id}`)
        .send(registerParticipantRequest)

      const registered = await prisma.participantProfile.findFirstOrThrow({
        where: { firstName: testFirstName, lastName: testLastName },
      })
      const dep1 = await prisma.participantProfile.findFirstOrThrow({
        where: { firstName: 'A', lastName: 'B' },
        select: { familyId: true, individualId: true, nextOfKin: { select: { email: true } } },
      })
      const dep2 = await prisma.participantProfile.findFirstOrThrow({
        where: { firstName: 'B', lastName: 'B' },
      })
      expect(registered.familyId).toEqual(dep1.familyId)
      expect(registered.familyId).toEqual(dep2.familyId)
      expect(dep1.nextOfKin?.email).toEqual('john@smith.com')
      expect(dep1.individualId).toContain('IND-')
      expect(registered.individualId).toContain('IND-')
    })

    it('Two parents with the same child receive same family ID, dependent is not re-registered', async () => {
      const registerParticipantRequest1: RegisterParticipantRequest = {
        ...registerParticipantRequestBase,
        dependents: [{ firstName: 'A', lastName: 'B', dob: '2020-01-01', permanent: false }],
      }
      const participantInviteId1 = await prisma.invite.findFirstOrThrow({
        where: {
          email: registerParticipantRequest1.email,
          studyId: 1,
        },
      })

      const registerParticipantRequest2: RegisterParticipantRequest = {
        ...registerParticipantRequestBase,
        firstName: testGuardianFirstName,
        email: TestInvites.INVITE_2_PENDING.email,
        dependents: [{ firstName: 'A', lastName: 'B', dob: '2020-01-01', permanent: false }],
      }
      const participantInviteId2 = await prisma.invite.findFirstOrThrow({
        where: {
          email: registerParticipantRequest2.email,
          studyId: 1,
        },
      })

      await request(app)
        .post(`/auth/register/participants/${participantInviteId1.id}`)
        .send(registerParticipantRequest1)
      await request(app)
        .post(`/auth/register/participants/${participantInviteId2.id}`)
        .send(registerParticipantRequest2)

      const registered1 = await prisma.participantProfile.findFirstOrThrow({
        where: { firstName: testFirstName, lastName: testLastName },
      })
      const registered2 = await prisma.participantProfile.findFirstOrThrow({
        where: { firstName: testGuardianFirstName, lastName: testLastName },
      })

      const dependents = await prisma.participantProfile.findMany({
        where: { firstName: 'A', lastName: 'B' },
      })

      expect(dependents.length).toEqual(1)

      expect(registered1.familyId).toEqual(registered2.familyId)
    })
  })

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      // Register a user
      const registerRequest: RegisterRequest = {
        firstName: testFirstName,
        lastName: testLastName,
        email: testEmail,
        password: testPassword,
        role: Role.OrganisationAdmin,
      }

      const response = await request(app)
        .post('/auth/register')
        .set({ Authorization: `Bearer ${orgAdminToken}` })
        .send(registerRequest)
      if (response.status != 201) throw Error('Could not register user!')
    })

    it('should return token, id, and role on standard login (OTP disabled)', async () => {
      jest.replaceProperty(config, 'otp', false)

      const loginRequest: LoginRequest = {
        email: TestUsers.ORG_ADMIN.email,
        password: TestUsers.ORG_ADMIN.password,
      }

      const loginResponse = await request(app).post('/auth/login').send(loginRequest)
      expect(loginResponse.status).toEqual(200)

      const loginBody = loginResponse.body as LoginSuccessResponse
      expect(loginBody.token).toBeDefined()

      expect(loginBody.id).toBe(TestUsers.ORG_ADMIN.id)
      expect(loginBody.role).toBe(Role.OrganisationAdmin)
      expect(loginBody).not.toHaveProperty('otp_token')
    })

    it('should allow access to protected routes', async () => {
      // Try to make a protected route request
      const protectedRouteResponse1 = await request(app).get('/users')
      const getAllUsersBody1 = protectedRouteResponse1.body

      // Should not allow access to protected routes without valid token
      expect(protectedRouteResponse1.status).toEqual(401)
      expect(getAllUsersBody1.message).toEqual('No token provided')
      expect(getAllUsersBody1.data).toBe(undefined)

      // Login the user
      const loginRequest: LoginRequest = {
        email: testEmail,
        password: testPassword,
      }
      const loginResponse = await request(app).post('/auth/login').send(loginRequest)
      expect(loginResponse.status).toEqual(200)

      const loginBody = loginResponse.body as LoginSuccessResponse
      expect(loginBody.token).not.toBeNull()

      // Add token to protected route request
      // Should allow access to protected routes with valid token
      const protectedRouteResponse2 = await request(app)
        .get('/users')
        .set({ Authorization: `Bearer ${loginBody.token}` })

      expect(protectedRouteResponse2.status).toEqual(200)
    })

    it("should return 401 and shouldn't allow the user to login with the incorrect password", async () => {
      // Login the user with incorrect password
      const loginRequest: LoginRequest = {
        email: testEmail,
        password: 'wrongPassword123',
      }

      const loginResponse = await request(app).post('/auth/login').send(loginRequest)
      expect(loginResponse.status).toEqual(401)

      const body = loginResponse.body
      expect(body.message).toBe('Invalid credentials')
      expect(body.token).toBe(undefined)
    })

    it('should return 422 if validation fails', async () => {
      const loginRequest = {
        email: testEmail,
      }

      const response = await request(app).post('/auth/login').send(loginRequest)
      expect(response.status).toEqual(422)

      const body = response.body
      expect(body.message).toBe('Validation Failed')
    })

    it('should fail validation if provided with empty values', async () => {
      const loginRequest: LoginRequest = {
        email: '',
        password: '',
      }

      const response = await request(app).post('/auth/login').send(loginRequest)
      expect(response.status).toEqual(422)

      const body = response.body
      expect(body.message).toBe('Validation Failed')
      expect(body.details).toEqual({
        'bodyRequest.email': { message: 'Invalid value provided' },
        'bodyRequest.password': { message: 'Invalid value provided' },
      })
    })

    it('should fail validation if provided with an invalid email', async () => {
      const loginRequest: LoginRequest = {
        email: 'Invalid Email',
        password: testPassword,
      }

      const response = await request(app).post('/auth/login').send(loginRequest)
      expect(response.status).toEqual(422)

      const body = response.body
      expect(body.message).toBe('Validation Failed')
      expect(body.details).toEqual({
        'bodyRequest.email': { message: 'Invalid value provided' },
      })
    })
    it('Should return an otp token if otp is enabled', async () => {
      jest.replaceProperty(config, 'otp', true)
      const loginRequest: LoginRequest = {
        email: TestUsers.PARTICIPANT_UNANSWERED.email,
        password: TestUsers.PARTICIPANT_UNANSWERED.password,
      }
      const loginResponse = await request(app).post('/auth/login').send(loginRequest)
      expect(loginResponse.ok).toBe(true)

      expect(loginResponse.body.otp_token).toBeDefined()
    })
    it('Should lock access for 10 mins if retries exceeded', async () => {
      await prisma.user.update({
        where: { id: TestUsers.PARTICIPANT_UNANSWERED.id },
        data: { retriesRemaining: 1 },
      })
      const loginRequest: LoginRequest = {
        email: TestUsers.PARTICIPANT_UNANSWERED.email,
        password: 'wrong123412345',
      }
      await request(app).post('/auth/login').send(loginRequest)
      const user = await prisma.user.findFirstOrThrow({
        where: { id: TestUsers.PARTICIPANT_UNANSWERED.id },
      })
      expect(user.retriesRemaining).toBe(0)
      const loginResponse = await request(app).post('/auth/login').send(loginRequest)
      expect(loginResponse.body.details).toBe('Retries exceeded, account locked for 10 minutes')
    })
    it('Should lock access for 24 hours if retries exceeded again in 24 hours', async () => {
      await prisma.user.update({
        where: { id: TestUsers.PARTICIPANT_UNANSWERED.id },
        data: { retriesRemaining: 0, lockedUntil: new Date(new Date().getTime() - 1000) },
      })
      const loginRequest: LoginRequest = {
        email: TestUsers.PARTICIPANT_UNANSWERED.email,
        password: 'wrong1234124312',
      }
      const loginResponse = await request(app).post('/auth/login').send(loginRequest)
      expect(loginResponse.body.details).toBe('Retries exceeded, account locked for 24 hours')
      const user = await prisma.user.findFirstOrThrow({
        where: { id: TestUsers.PARTICIPANT_UNANSWERED.id },
      })
      expect(user.retriesRemaining).toBe(10)
    })
    it('Should refresh retries after successful login', async () => {
      jest.replaceProperty(config, 'otp', false)

      await prisma.user.update({
        where: { id: TestUsers.PARTICIPANT_UNANSWERED.id },
        data: { retriesRemaining: 1 },
      })
      const loginRequest: LoginRequest = {
        email: TestUsers.PARTICIPANT_UNANSWERED.email,
        password: TestUsers.PARTICIPANT_UNANSWERED.password,
      }
      const loginResponse = await request(app).post('/auth/login').send(loginRequest)
      expect(loginResponse.ok).toBe(true)
      const user = await prisma.user.findFirstOrThrow({
        where: { id: TestUsers.PARTICIPANT_UNANSWERED.id },
      })
      expect(user.retriesRemaining).toBe(10)
    })
  })
  describe('POST /auth/login/otp', () => {
    beforeEach(async () => {
      await prisma.oTPToken.create({
        data: {
          code: '1223',
          expiresAt: new Date(new Date().getTime() + 1000 * 60),
          id: 'abc123',
          userId: TestUsers.PARTICIPANT_UNANSWERED.id,
        },
      })
    })
    it('Should allow login if otp is valid and return id and role', async () => {
      const loginRequest: OTPLoginRequest = {
        otp_code: '1223',
        otp_token: 'abc123',
      }
      const loginResponse = await request(app).post('/auth/login/otp').send(loginRequest)
      expect(loginResponse.ok).toBe(true)
      expect(loginResponse.body.token).toBeDefined()
      expect(loginResponse.body.id).toBe(TestUsers.PARTICIPANT_UNANSWERED.id)
      expect(loginResponse.body.role).toBe(Role.Participant)
    })
    it('Should decrement available retries if code is invalid', async () => {
      const loginRequest: OTPLoginRequest = {
        otp_code: '1220',
        otp_token: 'abc123',
      }
      const loginResponse = await request(app).post('/auth/login/otp').send(loginRequest)
      expect(loginResponse.ok).toBe(false)
      expect(loginResponse.body.token).toBeUndefined()
      const user = await prisma.user.findFirstOrThrow({
        where: { id: TestUsers.PARTICIPANT_UNANSWERED.id },
      })
      expect(user.retriesRemaining).toBe(9)
    })
    it('Should prevent login if otp is expired', async () => {
      await prisma.oTPToken.update({
        where: { id: 'abc123' },
        data: { expiresAt: new Date(new Date().getTime() - 1000) },
      })
      const loginRequest: OTPLoginRequest = {
        otp_code: '1223',
        otp_token: 'abc123',
      }
      const loginResponse = await request(app).post('/auth/login/otp').send(loginRequest)
      expect(loginResponse.body.details).toBe('Code expired')
    })
    it('Should not allow login if user is locked out', async () => {
      await prisma.user.update({
        where: { id: TestUsers.PARTICIPANT_UNANSWERED.id },
        data: { lockedUntil: new Date(new Date().getTime() + 1000 * 60) },
      })
      const loginRequest: OTPLoginRequest = {
        otp_code: '1223',
        otp_token: 'abc123',
      }
      const loginResponse = await request(app).post('/auth/login/otp').send(loginRequest)
      expect(loginResponse.body.details.includes('locked')).toBe(true)
    })
  })

  describe('POST /auth/login/oidc', () => {
    beforeEach(() => {
      jest.setMock('../config', {
        oidc: [
          {
            name: 'test',
            providerUrl: 'http://testurl',
            icon: 'https://aaf.edu.au/wp-content/uploads/AAF_LGO_small-website.png',
            clientId: 'testid',
            clientSecret: 'testsecret',
          },
        ],
      })
    })
    it('Should allow oidc login and return id and role', async () => {
      fetchMock.mockGlobal().route('http://testurl/.well-known/openid-configuration', {
        token_endpoint: 'http://token',
        userinfo_endpoint: 'http://userinfo',
      })
      fetchMock.mockGlobal().route('http://token', { access_token: '123' })
      fetchMock.mockGlobal().route('http://userinfo', {
        email: TestUsers.ORG_ADMIN.email,
      })

      const loginRequest: OIDCLoginRequest = {
        code: '123',
        provider: 'test',
        redirect_uri: 'redirect',
      }

      const response = await request(app).post('/auth/login/oidc').send(loginRequest)
      expect(response.status).toEqual(200)
      expect(response.body.token).toBeDefined()
      expect(response.body.role).toBe(Role.OrganisationAdmin)
      expect(response.body.id).toBe(TestUsers.ORG_ADMIN.id)
    })

    it('Should allow oidc login', async () => {
      fetchMock.mockGlobal().route('http://testurl/.well-known/openid-configuration', {
        token_endpoint: 'http://token',
        userinfo_endpoint: 'http://userinfo',
      })
      fetchMock.mockGlobal().route('http://token', { access_token: '123' })
      fetchMock.mockGlobal().route('http://userinfo', {
        email: TestUsers.ORG_ADMIN.email,
      })

      const loginRequest: OIDCLoginRequest = {
        code: '123',
        provider: 'test',
        redirect_uri: 'redirect',
      }

      const response = await request(app).post('/auth/login/oidc').send(loginRequest)
      expect(response.status).toEqual(200)
    })

    it('Should fail on nonexisting provider', async () => {
      fetchMock.mockGlobal().route('http://testurl/.well-known/openid-configuration', {
        token_endpoint: 'http://token',
        userinfo_endpoint: 'http://userinfo',
      })
      fetchMock.mockGlobal().route('http://token', { access_token: '123' })
      fetchMock.mockGlobal().route('http://userinfo', {
        email: TestUsers.ORG_ADMIN.email,
      })

      const loginRequest: OIDCLoginRequest = {
        code: '123',
        provider: 'test2',
        redirect_uri: 'redirect',
      }

      const response = await request(app).post('/auth/login/oidc').send(loginRequest)
      expect(response.ok).toBeFalsy()
    })

    it('Should enforce permissions', async () => {
      fetchMock.removeRoutes()
      fetchMock.mockGlobal().route('http://testurl/.well-known/openid-configuration', {
        token_endpoint: 'http://token',
        userinfo_endpoint: 'http://userinfo',
      })
      fetchMock.mockGlobal().route('http://token', { access_token: '123' })
      fetchMock.mockGlobal().route('http://userinfo', {
        email: TestUsers.PARTICIPANT_UNANSWERED.email,
      })

      const loginRequest: OIDCLoginRequest = {
        code: '123',
        provider: 'test',
        redirect_uri: 'redirect',
      }

      const response = await request(app)
        .post('/auth/login/oidc')
        .set({ 'x-client-type': 'admin-client' })
        .send(loginRequest)
      expect(response.status).toBe(401)
    })
  })
  describe('GET /auth/tcs', () => {
    it('redirects to tcs', async () => {
      const response = await request(app).get('/auth/tcs')
      expect(response.redirect).toBe(true)
      expect(response.headers['location']).toBe(
        'https://garvan-data-science-platform.github.io/ctrl-docs/docs/terms-and-conditions', //TODO: this should not have a default value see issue https://github.com/Garvan-Data-Science-Platform/ctrl/issues/870 Should be populated by seed for tests.
      )
    })
  })
})
