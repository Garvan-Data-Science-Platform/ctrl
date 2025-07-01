import request from 'supertest'
import { Api } from '../../src/Api'
import {
  RegisterParticipantRequest,
  RegisterRequest,
  RegisterResponse,
} from 'common/types/api/auth'
import { resetDB } from 'common/testing/TestHelpers'
import { TEST_STUDY_NAME } from 'common/testing/seed'
import {
  ContactMethod,
  ParticipantType,
  StateTerritory,
} from 'common/types/api/users/ParticipantProfile'
import prisma from '../../src/PrismaClient'
import { Role } from '@prisma/client'

const api = new Api()
const app = api.app

describe('Auth', () => {
  const testAdmin: RegisterRequest = {
    firstName: 'Test',
    lastName: 'Admin',
    email: 'test@admin.com',
    password: 'Password123',
    role: Role.OrganisationAdmin,
  }

  const testParticipant: RegisterRequest = {
    firstName: 'Test',
    lastName: 'Participant',
    email: 'test@participant.com',
    password: 'Password123',
    role: Role.Participant,
  }

  beforeAll(async () => {
    api.run()
  })

  beforeEach(async () => {
    await resetDB()

    // Register Admin
    const registerAdminResponse = await request(app).post('/auth/register').send(testAdmin)
    const adminBody: RegisterResponse = registerAdminResponse.body
    if (!adminBody.token) throw new Error('User could not be registered')

    // Register Participant
    const registerParticipantResponse = await request(app)
      .post('/auth/register')
      .send(testParticipant)
    const participantBody: RegisterResponse = registerParticipantResponse.body
    if (!participantBody.token) throw new Error('User could not be registered')
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
    process.env.JWT_EXPIRY = '0s'

    // Generate a valid token that will expire in 1 second
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({ email: testAdmin.email, password: testAdmin.password })

    expect(loginResponse.status).toBe(200)
    const token = loginResponse.body.token
    /*
    const protectedRouteBeforeExpiryResponse = await request(app)
      .get('/users')
      .set({ Authorization: `Bearer ${token}` })

    expect(protectedRouteBeforeExpiryResponse.status).toBe(200)
    expect(protectedRouteBeforeExpiryResponse.body.message).toBe('Got all users')
    expect(protectedRouteBeforeExpiryResponse.body.users).not.toBeNull()

    // Wait for 1 second to ensure the token expires
    //await new Promise((resolve) => setTimeout(resolve, 1000))
    */

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

    const getAllOrganisationsBody1 = protectedRouteResponse1.body

    // Should not allow access to protected routes without valid token
    expect(protectedRouteResponse1.status).toEqual(401)
    expect(getAllOrganisationsBody1.message).toEqual('No token provided')
    expect(getAllOrganisationsBody1.organisations).toBe(undefined)

    // Register the participant
    const participantRequest: RegisterParticipantRequest = {
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
      nextOfKin: {
        firstName: 'JOHN',
        lastName: 'SMITH',
        email: 'jonny@smith.com',
      },
      dependents: [],
    }

    const participantInviteId = await prisma.invite.findFirstOrThrow({
      where: {
        email: participantRequest.email,
        study: { name: TEST_STUDY_NAME },
      },
    })

    const participantResponse = await request(app)
      .post(`/auth/register/participants/${participantInviteId.id}`)
      .send(participantRequest)
    expect(participantResponse.status).toEqual(201)

    const participantBody = participantResponse.body
    expect(participantBody.token).not.toBeNull()

    // Add token to protected route request
    const protectedRouteResponse2 = await request(app)
      .get('/profiles/current')
      .set({ Authorization: `Bearer ${participantBody.token}` })

    expect(protectedRouteResponse2.status).toEqual(200)
  })

  it('should prevent a participant from accessing the admin portal', async () => {
    // Try to login as a participant from an external client
    const participantLoginSuccessResponse = await request(app)
      .post('/auth/login')
      .send({ email: testParticipant.email, password: testParticipant.password })

    expect(participantLoginSuccessResponse.status).toBe(200) // Should login successfully
    expect(participantLoginSuccessResponse.body.token).toBeDefined()

    // Try to login as a participant from the admin portal
    const participantLoginResponse = await request(app)
      .post('/auth/login')
      .set({ 'x-client-type': 'admin-client' }) // Set the client type to admin-client
      .send({ email: testParticipant.email, password: testParticipant.password })

    expect(participantLoginResponse.status).toBe(401) // Should not allow login
    expect(participantLoginResponse.body.message).toBe('Incorrect Permissions')
  })

  it('should prevent an admin from accessing the participant portal', async () => {
    // Try to login as a admin from an external client
    const adminLoginSuccessResponse = await request(app)
      .post('/auth/login')
      .send({ email: testAdmin.email, password: testAdmin.password })

    expect(adminLoginSuccessResponse.status).toBe(200) // Should login successfully
    expect(adminLoginSuccessResponse.body.token).toBeDefined()

    // Try to login as a admin from the admin portal
    const adminLoginResponse = await request(app)
      .post('/auth/login')
      .set({ 'x-client-type': 'user-client' }) // Set the client type to user-client
      .send({ email: testAdmin.email, password: testAdmin.password })

    expect(adminLoginResponse.status).toBe(401) // Should not allow login
    expect(adminLoginResponse.body.message).toBe('Incorrect Permissions')
  })
})
