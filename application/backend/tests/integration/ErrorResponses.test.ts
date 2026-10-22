import request from 'supertest'
import { Role } from '@prisma/client'
import { Api } from '../../src/Api'
import { generateToken } from '../../src/authentication'
import { CONFLICT_DETAILS } from '../../src/middlewares/ErrorHandler'
import { resetDB } from 'common/testing/TestHelpers'
import { TestUsers } from 'common/testing/constants'
import type { RegisterRequest } from 'common/types/api/auth'

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
    expect(response.body).toEqual({ message: 'Conflict', code: 'P2002', details: CONFLICT_DETAILS })
    expect(response.text).not.toContain('emailHash')
  })
})
