import request from 'supertest'
import { Api } from '../../src/Api'
import {
  RegisterParticipantRequest,
  RegisterParticipantResponse,
  RegisterRequest,
  RegisterResponse,
} from 'common/types/api/auth'
import { resetDB } from '../TestHelpers'
import { ContactMethod, StateTerritory } from 'common/types/api/users/ParticipantProfile'
import { GetAllOrganisationsResponse } from 'common/types/api/organisations'

const api = new Api()
const app = api.app

describe('Auth', () => {
  const testUser: RegisterRequest = {
    firstName: 'Test',
    lastName: 'User',
    email: 'test@user.com',
    password: 'Password123',
    role: 'test',
  }

  beforeAll(async () => {
    api.run()
  })

  beforeEach(async () => {
    await resetDB()

    // Register user
    const registerResponse = await request(app).post('/auth/register').send(testUser)
    const body: RegisterResponse = registerResponse.body
    if (!body.token) throw new Error('User could not be registered')
  })

  afterAll(async () => {
    api.stop()
  })

  it('should return a 401 unauthorized error when accessing protected routes without a token', async () => {
    const protectedRouteResponse = await request(app).get('/users')

    expect(protectedRouteResponse.status).toBe(401)
    expect(protectedRouteResponse.body.message).toBe('No token provided')
  })

  it('should return a 401 unauthorized error when accessing protected routes when using an expired token', async () => {
    // Set JWT expiry to 1 second
    process.env.JWT_EXPIRY = '1s'

    // Generate a valid token that will expire in 1 second
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password })

    expect(loginResponse.status).toBe(200)
    const token = loginResponse.body.token

    const protectedRouteBeforeExpiryResponse = await request(app)
      .get('/users')
      .set({ Authorization: `Bearer ${token}` })

    expect(protectedRouteBeforeExpiryResponse.status).toBe(200)
    expect(protectedRouteBeforeExpiryResponse.body.message).toBe('Got all users')
    expect(protectedRouteBeforeExpiryResponse.body.users).not.toBeNull()

    // Wait for 1 second to ensure the token expires
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const protectedRouteResponse = await request(app)
      .get('/users')
      .set({ Authorization: `Bearer ${token}` })

    expect(protectedRouteResponse.status).toBe(401)
    expect(protectedRouteResponse.body.message).toBe('jwt expired')

    // Revert expiry back
    process.env.JWT_EXPIRY = '1h'
  })

  it('should allow a participant to access protected routes', async () => {
    // Try to make a protected route request
    const protectedRouteResponse1 = await request(app).get('/organisations')

    const getAllOrganisationsBody1: GetAllOrganisationsResponse = protectedRouteResponse1.body

    // Should not allow access to protected routes without valid token
    expect(protectedRouteResponse1.status).toEqual(401)
    expect(getAllOrganisationsBody1.message).toEqual('No token provided')
    expect(getAllOrganisationsBody1.organisations).toBe(undefined)

    // Register the participant
    const participantRequest: RegisterParticipantRequest = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'johndoe@example.com',
      password: 'johnDoesP@ssword123',
      mobile: '+61477777777',
      addressLine: '123 Some Street',
      suburb: 'Sydney',
      postcode: '2000',
      state: StateTerritory.NSW,
      preferredContact: ContactMethod.MOBILE,
      dob: '1990-01-01',
      studyID: 'STUDY123',
      participantID: 'PARTICIPANT123',
      isParentOrGuardian: true,
    }

    const participantResponse = await request(app)
      .post('/auth/register/participant')
      .send(participantRequest)
    expect(participantResponse.status).toEqual(201)

    const participantBody: RegisterParticipantResponse = participantResponse.body
    expect(participantBody.message).toMatch(/Created participant with user ID: \d+/)
    expect(participantBody.token).not.toBeNull()

    // Add token to protected route request
    const protectedRouteResponse2 = await request(app)
      .get('/organisations')
      .set({ Authorization: `Bearer ${participantBody.token}` })

    const getAllOrganisationsBody2: GetAllOrganisationsResponse = protectedRouteResponse2.body
    expect(protectedRouteResponse2.status).toEqual(200)
    expect(getAllOrganisationsBody2.message).toEqual('Got all organisations')
  })

  it('should return a 401 unauthorized error when accessing protected routes with without the correct role', async () => {
    // TODO: Implement roles check and test here
  })
})
