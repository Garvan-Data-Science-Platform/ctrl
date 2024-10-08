import request from 'supertest'
import { Api } from '../Api'
import type { RegisterRequest, RegisterResponse } from 'common/types/api/auth'

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
      const protectedRouteResponse = await request(app).get('/users')

      const expectedProtectedRouteResponse = {
        body: { level: 'error', message: 'No token provided' },
        status: 401,
      }

      expect(protectedRouteResponse.status).toEqual(expectedProtectedRouteResponse.status)
      expect(protectedRouteResponse.body).toEqual(expectedProtectedRouteResponse.body)

      const registerRequest: RegisterRequest = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        password: 'password123',
        role: 'user',
      }

      // Register user
      const registerResponse = await request(app).post('/auth/register').send(registerRequest)
      const body: RegisterResponse = registerResponse.body
      const token: string | null = body['token']

      expect(registerResponse.status).toEqual(201)
      expect(body.message).toEqual('Created user with ID: 1')
      expect(body.token).not.toBeNull()

      // Add token to protected route request
      const response = await request(app)
        .get('/users')
        .set({ Authorization: `Bearer ${token}` })

      expect(response.status).toEqual(200)
      expect(response.body.message).toEqual('Got all users')
      expect(response.body.users).toHaveLength(1)
    })
    it('should register a new user returning a token', async () => {
      // const response = await request(app).post('/auth/register').send({
      //   firstName: 'John',
      //   lastName: 'Doe',
      //   email: 'john.doe@example.com',
      //   password: 'password123',
      //   role: 'user',
      // })
    })
    it('should return 422 if validation fails', async () => {})
  })

  // describe('POST /auth/login', () => {
  //   it('should allow access to protected routes', async () => {
  //     // try to make a protected route request
  //     // should fail
  //     // login user
  //     // add token to protected route request
  //     // should pass
  //   })
  //   it('should login the user returning a token', async () => {})
  //   it('should return 422 if validation fails', async () => {})
  // })

  // describe('hashPassword', () => {
  //   it('should hash the given password', async () => {})
  //   it('should produce different hashes for the same password due to random salt', async () => {})
  //   it('should throw an error if scrypt fails', async () => {})
  // })
  // describe('verifyPassword', () => {})
  // describe('generateToken', () => {})
})
