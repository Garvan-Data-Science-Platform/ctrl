import request from 'supertest'
import { Role } from '@prisma/client'
import { Api } from '../../src/Api'
import prisma from '../../src/PrismaClient'
import { generateToken } from '../../src/authentication'
import { CONFLICT_MESSAGE } from '../../src/middlewares/ErrorHandler'
import { resetDB } from 'common/testing/TestHelpers'
import { TestStudies, TestUsers } from 'common/testing/constants'
import type { RegisterParticipantRequest, RegisterRequest } from 'common/types/api/auth'
import {
  ContactMethod,
  ParticipantType,
  StateTerritory,
} from 'common/types/api/users/ParticipantProfile'
import type { OIDCLoginRequest, OTPLoginRequest } from 'common/types/api/auth/login'
import type { UpdateSurveyAnswersRequest } from 'common/types/api/surveys'

// Error responses must never carry internal error text, such as Prisma's message, which quotes the
// values the client sent.
const PLANTED_SECRET = 'PlantedSecret-971'

const api = new Api()
const app = api.app

describe('Error responses', () => {
  let participantToken: string
  let orgAdminToken: string

  beforeAll(async () => {
    api.run()
  })

  beforeEach(async () => {
    await resetDB()
    participantToken = await generateToken({ userId: TestUsers.PARTICIPANT_UNANSWERED.id })
    orgAdminToken = await generateToken({ userId: TestUsers.ORG_ADMIN.id })
  })

  afterAll(async () => {
    api.stop()
  })

  it('should not send back submitted values when Prisma rejects an update', async () => {
    const response = await request(app)
      .patch('/profiles/current')
      .set({ Authorization: `Bearer ${participantToken}` })
      .send({ password: PLANTED_SECRET })

    expect(response.status).toBe(500)
    expect(response.body).toEqual({ message: 'Internal Server Error' })
    expect(response.text).not.toContain(PLANTED_SECRET)
  })

  it('should return a 409 without model or column names for a duplicate email', async () => {
    const registerRequest: RegisterRequest = {
      firstName: 'Duplicate',
      lastName: 'Email',
      email: TestUsers.PARTICIPANT_UNANSWERED.email,
      password: TestUsers.PARTICIPANT_UNANSWERED.password,
      role: Role.Participant,
    }
    const response = await request(app)
      .post('/auth/register')
      .set({ Authorization: `Bearer ${orgAdminToken}` })
      .send(registerRequest)

    expect(response.status).toBe(409)
    expect(response.body).toEqual({
      message: CONFLICT_MESSAGE,
      code: 'P2002',
      details: CONFLICT_MESSAGE,
    })
    expect(response.text).not.toContain('emailHash')
  })

  it('should return a 409 with readable text when an existing user registers through a new invite', async () => {
    const invite = await prisma.invite.create({
      data: {
        email: TestUsers.PARTICIPANT_UNANSWERED.email,
        studyId: TestStudies.TEST_STUDY_2.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day in the future
      },
    })
    const registerRequest: RegisterParticipantRequest = {
      firstName: 'Existing',
      lastName: 'Participant',
      email: TestUsers.PARTICIPANT_UNANSWERED.email,
      password: 'Loginfortests123',
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

    const response = await request(app)
      .post(`/auth/register/participants/${invite.id}`)
      .send(registerRequest)

    expect(response.status).toBe(409)
    expect(response.body).toEqual({
      message: CONFLICT_MESSAGE,
      code: 'P2002',
      details: CONFLICT_MESSAGE,
    })
    expect(response.text).not.toContain('emailHash')
  })

  it('should return a 422 with its message when OIDC is not configured', async () => {
    const loginRequest: OIDCLoginRequest = {
      code: '123',
      provider: 'test',
      redirect_uri: 'redirect',
    }
    const response = await request(app).post('/auth/login/oidc').send(loginRequest)

    expect(response.status).toBe(422)
    expect(response.body).toEqual({
      message: 'Unprocessable Content',
      details: 'OIDC Not Configured',
    })
  })

  it('should return a 422 with its message for an unknown OTP token', async () => {
    const otpRequest: OTPLoginRequest = { otp_token: 'does-not-exist', otp_code: '123456' }
    const response = await request(app).post('/auth/login/otp').send(otpRequest)

    expect(response.status).toBe(422)
    expect(response.body).toEqual({ message: 'Unprocessable Content', details: 'Bad request' })
  })

  it('should return a 422 with its message for answers to an unpublished survey version', async () => {
    const draft = await prisma.surveyVersion.create({
      data: { studyId: TestStudies.TEST_STUDY.id, versionNumber: 999, data: [] },
    })
    await prisma.surveyVersionAnswers.create({
      data: { versionId: draft.id, profileId: TestUsers.PARTICIPANT_COMPLETED.id, answers: [] },
    })
    const participantCompletedToken = await generateToken({
      userId: TestUsers.PARTICIPANT_COMPLETED.id,
    })
    const reqBody: UpdateSurveyAnswersRequest = { step: 1, data: [true, 'Choice 1'] }

    const response = await request(app)
      .post(`/studies/${TestStudies.TEST_STUDY.id}/survey-answers`)
      .set({ Authorization: `Bearer ${participantCompletedToken}` })
      .send(reqBody)

    expect(response.status).toBe(422)
    expect(response.body).toEqual({
      message: 'Unprocessable Content',
      details: 'Cannot submit answers for unpublished survey version',
    })
  })
})
