import request from 'supertest'
import { Api } from '../Api'
import type {
  LoginRequest,
  LoginResponse,
  RegisterParticipantRequest,
  RegisterParticipantResponse,
  RegisterRequest,
  RegisterResponse,
} from 'common/types/api/auth'
import type { GetAllUsersResponse } from 'common/types/api/users'
import prisma from '../PrismaClient'
import { resetDB } from '../../tests/TestHelpers'
import { ContactMethod } from '../../../common/types/api/users/ParticipantProfile'

const api = new Api()
const app = api.app

describe('AuthController', () => {
  beforeAll(async () => {
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

      const getAllUsersBody1: GetAllUsersResponse = protectedRouteResponse1.body

      expect(protectedRouteResponse1.status).toEqual(401)
      expect(getAllUsersBody1.message).toEqual('No token provided')
      expect(getAllUsersBody1.data).toBe(undefined)

      const registerRequest: RegisterRequest = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'testregister@example.com',
        password: 'Password123',
        role: 'user',
      }

      // Register user
      const registerResponse = await request(app).post('/auth/register').send(registerRequest)
      expect(registerResponse.status).toEqual(201)

      const registerBody: RegisterResponse = registerResponse.body

      expect(registerBody.message).toMatch(/Registered user with ID: \d+/)
      expect(registerBody.token).not.toBeNull()

      // Add token to protected route request
      const protectedRouteResponse2 = await request(app)
        .get('/users')
        .set({ Authorization: `Bearer ${registerBody.token}` })

      const getAllUsersBody2: GetAllUsersResponse = protectedRouteResponse2.body

      expect(protectedRouteResponse2.status).toEqual(200)
      expect(getAllUsersBody2.message).toEqual('Got all users')
    })

    it('should register a new user returning a token', async () => {
      const registerRequest: RegisterRequest = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'newUser@example.com',
        password: 'Password123',
        role: 'user',
      }

      // Check if user is already registered
      const existingUser = await prisma.user.findFirst({ where: { email: registerRequest.email } })
      expect(existingUser).toBeNull()

      // Register user
      const response = await request(app).post('/auth/register').send(registerRequest)
      expect(response.status).toEqual(201)
      const body: RegisterResponse = response.body
      expect(body.message).toMatch(/Registered user with ID: \d+/)
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
        role: 'user',
      }

      const response = await request(app).post('/auth/register').send(registerRequest)
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
        role: 'user',
      }

      // Register user
      await request(app).post('/auth/register').send(registerRequest)

      // Try to register again with the same email
      const response = await request(app).post('/auth/register').send(registerRequest)
      expect(response.status).toEqual(500)
    })

    it('should fail validation if provided with an invalid email', async () => {
      const registerRequest: RegisterRequest = {
        email: 'invalid email',
        firstName: 'John',
        lastName: 'Doe',
        password: 'Password123',
        role: 'user',
      }

      const response = await request(app).post('/auth/register').send(registerRequest)
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
        role: 'user',
      }

      const response = await request(app).post('/auth/register').send(registerRequest)
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
        role: '',
      }

      const response = await request(app).post('/auth/register').send(registerRequest)
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
        role: 'user',
      }

      const response = await request(app).post('/auth/register').send(registerRequest)
      expect(response.status).toEqual(422)

      const body = response.body
      expect(body.message).toBe('Validation Failed')
      expect(body.details).toEqual({
        Uppercase: { message: 'Password must contain at least one uppercase letter' },
        Number: { message: 'Password must contain at least one number' },
      })
    })
  })

  describe('POST /auth/register/participant', () => {
    it('should register a new user returning a token', async () => {
      const registerParticipantRequest: RegisterParticipantRequest = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'johndoe@example.com',
        password: 'johnDoesP@ssword123',
        mobile: '+61477777777',
        addressLine: '123 Some Street, Sydney, NSW',
        preferredContact: ContactMethod.MOBILE,
        dob: '1990-01-01',
        studyID: 'STUDY123',
        participantID: 'PARTICIPANT123',
        isParentOrGuardian: true,
      }

      const participantResponse = await request(app)
        .post('/auth/register/participant')
        .send(registerParticipantRequest)

      expect(participantResponse.status).toEqual(201)

      const participantBody: RegisterParticipantResponse = participantResponse.body
      expect(participantBody.message).toMatch(/Created participant with user ID: \d+/)
      expect(participantBody.token).not.toBeNull()
    })
    it('should fail validation if the password is not strong', async () => {
      const registerParticipantRequest: RegisterParticipantRequest = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'johndoe@example.com',
        password: 'weakpassword',
        mobile: '+61477777777',
        addressLine: '123 Some Street, Sydney, NSW',
        preferredContact: ContactMethod.MOBILE,
        dob: '1990-01-01',
        studyID: 'STUDY123',
        participantID: 'PARTICIPANT123',
        isParentOrGuardian: true,
      }

      const registerParticipantResponse = await request(app)
        .post('/auth/register/participant')
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
        firstName: 'John',
        lastName: '',
        email: 'johndoe@example.com',
        password: 'GooD02Password',
        mobile: '12341234',
        addressLine: '123 Some Street, Sydney, NSW',
        preferredContact: ContactMethod.MOBILE,
        dob: '1990-01-01',
        studyID: '',
        participantID: '',
        isParentOrGuardian: true,
      }

      const registerParticipantResponse = await request(app)
        .post('/auth/register/participant')
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
        'bodyRequest.participantID': {
          message: 'minLength 1',
          value: '',
        },
        'bodyRequest.mobile': {
          message: 'please provide valid phone number',
          value: '12341234',
        },
        'bodyRequest.studyID': {
          message: 'minLength 1',
          value: '',
        },
      })
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
        role: 'user',
      }

      const response = await request(app).post('/auth/register').send(registerRequest)
      if (response.status != 201) throw Error('Could not register user!')
    })

    it('should allow access to protected routes', async () => {
      // Try to make a protected route request
      const protectedRouteResponse1 = await request(app).get('/users')
      const getAllUsersBody1: GetAllUsersResponse = protectedRouteResponse1.body

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
      expect(loginBody.message).toEqual('Logged in Successfully!')
      expect(loginBody.token).not.toBeNull()

      // Add token to protected route request
      // Should allow access to protected routes with valid token
      const protectedRouteResponse2 = await request(app)
        .get('/users')
        .set({ Authorization: `Bearer ${loginBody.token}` })

      const getAllUsersBody2: GetAllUsersResponse = protectedRouteResponse2.body

      expect(protectedRouteResponse2.status).toEqual(200)
      expect(getAllUsersBody2.message).toEqual('Got all users')
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
      expect(body.message).toBe('Incorrect Password')
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
})
