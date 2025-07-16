import request from 'supertest'
import { Api } from '../Api'
import type {
  LoginRequest,
  LoginResponse,
  OIDCLoginRequest,
  RegisterParticipantRequest,
  RegisterParticipantResponse,
  RegisterRequest,
  RegisterResponse,
} from 'common/types/api/auth'
import prisma from '../PrismaClient'
import { Role } from '@prisma/client'
import { resetDB, wipeDB } from 'common/testing/TestHelpers'
import { PARTICIPANT_UNANSWERED_EMAIL, TEST_STUDY } from 'common/testing/seed'
import {
  ContactMethod,
  ParticipantType,
  StateTerritory,
} from 'common/types/api/users/ParticipantProfile'
import { generateToken } from '../authentication'
import fetchMock from 'fetch-mock'

const api = new Api()
const app = api.app
let orgAdminToken: string
jest.mock('../config')

describe('AuthController', () => {
  beforeAll(async () => {
    orgAdminToken = await generateToken({
      userId: 555,
      roles: ['OrganisationAdmin'],
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
        firstName: 'John',
        lastName: 'Doe',
        email: 'testregister@example.com',
        password: 'Password123',
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
        firstName: 'John',
        lastName: 'Doe',
        email: 'newUser@example.com',
        password: 'Password123',
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
        firstName: 'John',
        lastName: 'Doe',
        password: 'password123',
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

    it('should return an error if the user is already registered', async () => {
      const registerRequest: RegisterRequest = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'johndoe@example.com',
        password: 'Password123',
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
        firstName: 'John',
        lastName: 'Doe',
        password: 'Password123',
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
          message: 'Please provide valid email',
          value: registerRequest.email,
        },
      })
    })

    it('should fail validation if provided with an invalid password', async () => {
      const registerRequest: RegisterRequest = {
        email: 'johndoe@example.com',
        firstName: 'John',
        lastName: 'Doe',
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
          message: 'Password must be at least 8 characters',
          value: 'pass',
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
        'bodyRequest.firstName': { message: 'minLength 1', value: '' },
        'bodyRequest.lastName': { message: 'minLength 1', value: '' },
        'bodyRequest.email': { message: 'Please provide valid email', value: '' },
        'bodyRequest.password': { message: 'Password must be at least 8 characters', value: '' },
      })
    })

    it('should fail validation if the password is not strong', async () => {
      const registerRequest: RegisterRequest = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'johndoe@example.com',
        password: 'somepasswordthatsnotstrong',
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
        Uppercase: { message: 'Password must contain at least one uppercase letter' },
        Number: { message: 'Password must contain at least one number' },
      })
    })
  })

  describe('POST /auth/register/setup', () => {
    it('Should allow setup registration when db has been wiped', async () => {
      await wipeDB()
      const res = await request(app)
        .post('/auth/register/setup')
        .send({ email: 'testadmin@test.com', password: 'abDFS141@!' })
      expect(res.status).toEqual(201)
      const user = await prisma.user.findFirst({ where: { email: 'testadmin@test.com' } })
      expect(user).not.toBeNull()
    })
    it('Should not allow setup registration when a user exists', async () => {
      await resetDB()
      const res = await request(app)
        .post('/auth/register/setup')
        .send({ email: 'testadmin@test.com', password: 'abDFS141@!' })
      expect(res.ok).toBe(false)
    })
  })

  describe('POST /auth/register/participant/{inviteId}', () => {
    const registerParticipantRequestBase: RegisterParticipantRequest = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'johnDoesP@ssword123',
      mobile: '+61477777777',
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
            name: TEST_STUDY,
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
        password: 'weakpassword',
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
        Uppercase: { message: 'Password must contain at least one uppercase letter' },
        Number: { message: 'Password must contain at least one number' },
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
          message: 'minLength 1',
          value: '',
        },
        'bodyRequest.mobile': {
          message: 'please provide valid phone number',
          value: '12341234',
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
        where: { firstName: 'John', lastName: 'Doe' },
      })
      const dep1 = await prisma.participantProfile.findFirstOrThrow({
        where: { firstName: 'A', lastName: 'B' },
        select: { familyId: true, nextOfKin: { select: { email: true } } },
      })
      const dep2 = await prisma.participantProfile.findFirstOrThrow({
        where: { firstName: 'B', lastName: 'B' },
      })
      expect(registered.familyId).toEqual(dep1.familyId)
      expect(registered.familyId).toEqual(dep2.familyId)
      expect(dep1.nextOfKin?.email).toEqual('john@smith.com')
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
        firstName: 'Jenny',
        email: 'jenny@gmail.com',
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
        where: { firstName: 'John', lastName: 'Doe' },
      })
      const registered2 = await prisma.participantProfile.findFirstOrThrow({
        where: { firstName: 'Jenny', lastName: 'Doe' },
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
        firstName: 'John',
        lastName: 'Doe',
        email: 'johndoe@email.com',
        password: 'johnDoesP@ssword123',
        role: Role.OrganisationAdmin,
      }

      const response = await request(app)
        .post('/auth/register')
        .set({ Authorization: `Bearer ${orgAdminToken}` })
        .send(registerRequest)
      if (response.status != 201) throw Error('Could not register user!')
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
        email: 'johndoe@email.com',
        password: 'johnDoesP@ssword123',
      }
      const loginResponse = await request(app).post('/auth/login').send(loginRequest)
      expect(loginResponse.status).toEqual(200)

      const loginBody: LoginResponse = loginResponse.body
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
        email: 'johndoe@email.com',
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
        email: 'johndoe@email.com',
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
        'bodyRequest.email': { message: 'Please provide valid email', value: '' },
        'bodyRequest.password': { message: 'Password must be at least 8 characters', value: '' },
      })
    })

    it('should fail validation if provided with an invalid email', async () => {
      const loginRequest: LoginRequest = {
        email: 'Invalid Email',
        password: 'SomeGoodPassword123',
      }

      const response = await request(app).post('/auth/login').send(loginRequest)
      expect(response.status).toEqual(422)

      const body = response.body
      expect(body.message).toBe('Validation Failed')
      expect(body.details).toEqual({
        'bodyRequest.email': { message: 'Please provide valid email', value: loginRequest.email },
      })
    })
  })
  describe('POST /auth/login/oidc', () => {
    it('Should allow oidc login', async () => {
      fetchMock.mockGlobal().route('http://testurl/oauth2/token', { access_token: '123' })
      fetchMock.mockGlobal().route('http://testurl/oauth2/userinfo', {
        email: 'test1@example.com',
      })

      const loginRequest: OIDCLoginRequest = {
        code: '123',
        provider: 'test',
        redirect_uri: 'redirect',
      }

      const response = await request(app).post('/auth/login/oidc').send(loginRequest)
      expect(response.status).toEqual(200)
      expect(response.body)
    })

    it('Should allow oidc login', async () => {
      fetchMock.mockGlobal().route('http://testurl/oauth2/token', { access_token: '123' })
      fetchMock.mockGlobal().route('http://testurl/oauth2/userinfo', {
        email: 'test1@example.com',
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
      fetchMock.mockGlobal().route('http://testurl/oauth2/token', { access_token: '123' })
      fetchMock.mockGlobal().route('http://testurl/oauth2/userinfo', {
        email: 'test1@example.com',
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
      fetchMock.mockGlobal().route('http://testurl/oauth2/token', { access_token: '123' })
      fetchMock.mockGlobal().route('http://testurl/oauth2/userinfo', {
        email: PARTICIPANT_UNANSWERED_EMAIL,
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
})
