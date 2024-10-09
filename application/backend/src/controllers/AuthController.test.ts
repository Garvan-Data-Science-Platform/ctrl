import request from 'supertest'
import { Api } from '../Api'
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
} from 'common/types/api/auth'
import type { GetAllUsersResponse } from 'common/types/api/users'
import prisma from '../PrismaClient'

const api = new Api()
const app = api.app

describe('AuthController', () => {
  beforeAll(async () => {
    api.run()
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
      expect(getAllUsersBody1.users).toBe(undefined)

      const registerRequest: RegisterRequest = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'testregister@example.com',
        password: 'password123',
        role: 'user',
      }

      // Register user
      const registerResponse = await request(app).post('/auth/register').send(registerRequest)
      expect(registerResponse.status).toEqual(201)

      const registerBody: RegisterResponse = registerResponse.body

      expect(registerBody.message).toMatch(/Created user with ID: \d+/)
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
        password: 'password123',
        role: 'user',
      }

      // Check if user is already registered
      const existingUser = await prisma.user.findFirst({ where: { email: registerRequest.email } })
      expect(existingUser).toBeNull()

      // Register user
      const response = await request(app).post('/auth/register').send(registerRequest)
      expect(response.status).toEqual(201)
      const body: RegisterResponse = response.body
      expect(body.message).toMatch(/Created user with ID: \d+/)
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
    it('should return an error if the user is already registered', async () => {})
  })

  describe('POST /auth/login', () => {
    beforeAll(async () => {
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
      expect(getAllUsersBody1.users).toBe(undefined)

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
    it('should login the user returning a token', async () => {})
    it("shouldn't allow the user to login with the incorrect password", async () => {})
    it('should return 422 if validation fails', async () => {})
  })

  describe('hashPassword', () => {
    it('should hash the given password', async () => {})
    it('should produce different hashes for the same password due to random salt', async () => {})
    it('should throw an error if scrypt fails', async () => {})
  })
  describe('verifyPassword', () => {})
  describe('generateToken', () => {})
})
