import request from 'supertest'
import { Api } from '../../src/Api'
import {
  LoginRequest,
  RegisterParticipantRequest,
  RegisterRequest,
  RegisterResponse,
} from 'common/types/api/auth'
import { resetDB } from 'common/testing/TestHelpers'
import { TestUsers, TestStudies, TestInvites } from 'common/testing/constants'
import {
  ContactMethod,
  ParticipantType,
  StateTerritory,
} from 'common/types/api/users/ParticipantProfile'
import prisma from '../../src/PrismaClient'
import { Role } from '@prisma/client'
import { generateToken } from '../../src/authentication'
import { NodemailerMock } from 'nodemailer-mock'
import * as nodemailer from 'nodemailer'

jest.mock('../../src/config')
import config from '../../src/config'
import { OTPLoginRequest } from 'common/types/api/auth/login'

const mockNodeMailer = nodemailer as unknown as NodemailerMock

const api = new Api()
const app = api.app

describe('Auth', () => {
  const testAdmin: RegisterRequest = {
    firstName: 'Test',
    lastName: 'Admin',
    email: 'test@admin.com',
    password: TestUsers.ORG_ADMIN.password, // Note: using test data so it fits password policy
    role: Role.OrganisationAdmin,
  }

  const testParticipant: RegisterRequest = {
    firstName: 'Test',
    lastName: 'Participant',
    email: 'test@participant.com',
    password: TestUsers.ORG_ADMIN.password, // Note: using test data so it fits password policy
    role: Role.Participant,
  }

  beforeAll(async () => {
    api.run()
  })

  beforeEach(async () => {
    await resetDB()

    const orgAdminToken = await generateToken({
      userId: TestUsers.ORG_ADMIN.id,
    })

    // Register Admin
    const registerAdminResponse = await request(app)
      .post('/auth/register')
      .set({ Authorization: `Bearer ${orgAdminToken}` })
      .send(testAdmin)
    const adminBody: RegisterResponse = registerAdminResponse.body
    if (!adminBody.token) throw new Error('User could not be registered')

    // Register Participant
    const registerParticipantResponse = await request(app)
      .post('/auth/register')
      .set({ Authorization: `Bearer ${orgAdminToken}` })
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

  it('trims leading whitespace on participant register so subsequent login without the space succeeds', async () => {
    const email = 'ws-lead@example.com'
    const rawPassword = ' Constellation-battery-24!'

    const invite = await prisma.invite.create({
      data: {
        email,
        status: 'PENDING',
        studyId: TestStudies.TEST_STUDY.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    const participantRequest: RegisterParticipantRequest = {
      firstName: 'John',
      lastName: 'Doe',
      email,
      password: rawPassword,
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

    await request(app)
      .post(`/auth/register/participants/${invite.id}`)
      .send(participantRequest)
      .expect(201)

    const loginRes = await request(app)
      .post('/auth/login')
      .set('x-client-type', 'user-client')
      .send({ email, password: rawPassword.trim() })
    expect(loginRes.status).toBe(200)
  })

  it('trims trailing whitespace on participant register so subsequent login without the space succeeds', async () => {
    const email = 'ws-trail@example.com'
    const rawPassword = 'Constellation-battery-24! '

    const invite = await prisma.invite.create({
      data: {
        email,
        status: 'PENDING',
        studyId: TestStudies.TEST_STUDY.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    const participantRequest: RegisterParticipantRequest = {
      firstName: 'Jane',
      lastName: 'Doe',
      email,
      password: rawPassword,
      mobile: '+61477777778',
      addressLine: '124 Some Street',
      suburb: 'Sydney',
      postcode: '2000',
      state: StateTerritory.NSW,
      preferredContact: ContactMethod.MOBILE,
      dob: '1990-01-02',
      participantType: ParticipantType.STANDARD,
      nextOfKin: {
        firstName: 'JOHN',
        lastName: 'SMITH',
        email: 'jonny@smith.com',
      },
      dependents: [],
    }

    await request(app)
      .post(`/auth/register/participants/${invite.id}`)
      .send(participantRequest)
      .expect(201)

    const loginRes = await request(app)
      .post('/auth/login')
      .set('x-client-type', 'user-client')
      .send({ email, password: rawPassword.trim() })
    expect(loginRes.status).toBe(200)
  })

  it('rejects an all-whitespace password on participant register (fails length after trim)', async () => {
    const email = 'ws-empty@example.com'

    const invite = await prisma.invite.create({
      data: {
        email,
        status: 'PENDING',
        studyId: TestStudies.TEST_STUDY.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    const participantRequest: RegisterParticipantRequest = {
      firstName: 'Bob',
      lastName: 'Doe',
      email,
      password: '              ',
      mobile: '+61477777779',
      addressLine: '125 Some Street',
      suburb: 'Sydney',
      postcode: '2000',
      state: StateTerritory.NSW,
      preferredContact: ContactMethod.MOBILE,
      dob: '1990-01-03',
      participantType: ParticipantType.STANDARD,
      nextOfKin: {
        firstName: 'JOHN',
        lastName: 'SMITH',
        email: 'jonny@smith.com',
      },
      dependents: [],
    }

    const res = await request(app)
      .post(`/auth/register/participants/${invite.id}`)
      .send(participantRequest)
    expect(res.status).toBe(422)
  })

  it('trims whitespace on admin register so subsequent login without the space succeeds', async () => {
    const orgAdminToken = await generateToken({ userId: TestUsers.ORG_ADMIN.id })
    const rawEmail = ' ws-admin-lead@example.com'
    const password = 'Constellation-battery-24!'

    await request(app)
      .post('/auth/register')
      .set({ Authorization: `Bearer ${orgAdminToken}` })
      .send({
        firstName: 'WS',
        lastName: 'Admin',
        email: rawEmail,
        password,
        role: Role.OrganisationAdmin,
      })
      .expect(201)

    const loginRes = await request(app)
      .post('/auth/login')
      .send({ email: rawEmail.trim(), password })
    expect(loginRes.status).toBe(200)
  })

  it('rejects re-registering with a clean version of a padded email as duplicate', async () => {
    const orgAdminToken = await generateToken({ userId: TestUsers.ORG_ADMIN.id })
    const paddedEmail = ' ws-admin-dup@example.com'
    const password = 'Constellation-battery-24!'

    await request(app)
      .post('/auth/register')
      .set({ Authorization: `Bearer ${orgAdminToken}` })
      .send({
        firstName: 'First',
        lastName: 'Admin',
        email: paddedEmail,
        password,
        role: Role.OrganisationAdmin,
      })
      .expect(201)

    const dupRes = await request(app)
      .post('/auth/register')
      .set({ Authorization: `Bearer ${orgAdminToken}` })
      .send({
        firstName: 'Second',
        lastName: 'Admin',
        email: paddedEmail.trim(),
        password,
        role: Role.OrganisationAdmin,
      })
    expect(dupRes.status).not.toBe(201)
    expect(dupRes.body.message).toBe('emailHash already in use')
  })

  it('trims whitespace on next-of-kin email during participant register', async () => {
    const email = 'ws-nok@example.com'
    const paddedNokEmail = ' nok-trim@example.com '
    const password = 'Constellation-battery-24!'

    const invite = await prisma.invite.create({
      data: {
        email,
        status: 'PENDING',
        studyId: TestStudies.TEST_STUDY.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    const participantRequest: RegisterParticipantRequest = {
      firstName: 'Ned',
      lastName: 'Kelly',
      email,
      password,
      mobile: '+61477777780',
      addressLine: '126 Some Street',
      suburb: 'Sydney',
      postcode: '2000',
      state: StateTerritory.NSW,
      preferredContact: ContactMethod.MOBILE,
      dob: '1990-01-04',
      participantType: ParticipantType.STANDARD,
      nextOfKin: {
        firstName: 'NOK',
        lastName: 'PERSON',
        email: paddedNokEmail,
      },
      dependents: [],
    }

    await request(app)
      .post(`/auth/register/participants/${invite.id}`)
      .send(participantRequest)
      .expect(201)

    const profile = await prisma.participantProfile.findFirst({
      where: { user: { email } },
      include: { nextOfKin: true },
    })
    expect(profile?.nextOfKin?.email).toBe(paddedNokEmail.trim())
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
      email: TestInvites.INVITE_2_PENDING.email,
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
        study: { name: TestStudies.TEST_STUDY.name },
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
  it('Should enforce limited password retries', () => {})

  it('Should support OTP based login', async () => {
    jest.replaceProperty(config, 'otp', true)
    const loginRequest: LoginRequest = {
      email: TestUsers.PARTICIPANT_UNANSWERED.email,
      password: TestUsers.PARTICIPANT_UNANSWERED.password,
    }
    const res = await request(app).post('/auth/login').send(loginRequest)
    const sentEmails = mockNodeMailer.mock.getSentMail()
    const code = sentEmails[0].text?.toString().slice(-4) || ''

    const otpRequest: OTPLoginRequest = {
      otp_code: code,
      otp_token: res.body.otp_token,
    }
    const res2 = await request(app).post('/auth/login/otp').send(otpRequest)
    expect(res2.ok).toBe(true)
    expect(res2.body.token).toBeDefined()
  })
})
