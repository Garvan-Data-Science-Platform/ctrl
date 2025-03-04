import request from 'supertest'
import { generateToken } from '../../src/authentication'
import { Api } from '../../src/Api'
import { resetDB } from 'common/testing/TestHelpers'
import {
  GetResponsesByIdResponse,
  GetUserSurveyStepResponse,
  GetUserSurveyStepsResponse,
  UpdateSurveyAnswersRequest,
  UpdateSurveyRequest,
} from 'common/types/api/surveys'
import { RegisterParticipantRequest } from 'common/types/api/auth'
import {
  ContactMethod,
  ParticipantType,
  StateTerritory,
} from 'common/types/api/users/ParticipantProfile'
import { GetParticipantsResponse } from 'common/types/api/participants'
import { ORG_ADMIN_ID } from 'common/testing/seed'
import prisma from '../../src/PrismaClient'
import { SurveysController } from '../../src/controllers/SurveysController'
import { UsersController } from '../../src/controllers/UsersController'

const api = new Api()
const app = api.app
let participantToken: string, adminToken: string

describe('Survey tests', () => {
  beforeAll(async () => {
    api.run()
    await resetDB()

    participantToken = await generateToken({ userId: 1, roles: ['Participant'] })
    adminToken = await generateToken({ userId: ORG_ADMIN_ID, roles: ['OrganisationAdmin'] })
  })

  afterAll(async () => {
    api.stop()
  })

  it('User registers and sees current survey version', async () => {
    const reqBody: RegisterParticipantRequest = {
      addressLine: 'abc',
      dob: '1990-01-01',
      email: 'parent1@gmail.com',
      firstName: 'J',
      lastName: 'K',
      mobile: '0412345678',
      nextOfKin: { email: 'nok@gmail.com', firstName: 'N', lastName: 'k' },
      participantType: ParticipantType.STANDARD,
      password: 'PASS123of2389vNDFS!',
      postcode: '1234',
      preferredContact: ContactMethod.MOBILE,
      state: StateTerritory.ACT,
      suburb: 'ABCKDF',
      dependents: [
        { firstName: 'Child1', lastName: 'K', dob: '2020-01-01', permanent: true },
        { firstName: 'Child2', lastName: 'K', dob: '2020-01-02', permanent: false },
      ],
    }
    const reqBody2 = { ...reqBody, email: 'parent2@gmail.com' }

    let regRes = await request(app).post('/auth/register/participant').send(reqBody)
    expect(regRes.statusCode).toBe(201)
    regRes = await request(app).post('/auth/register/participant').send(reqBody2)
    expect(regRes.statusCode).toBe(201)

    const deps1 = await prisma.participantProfile.findMany({ where: { firstName: 'Child1' } })
    expect(deps1).toHaveLength(1)
  })

  it('One parent submits answers and both dependents inherit all answers', async () => {
    const reqBody: UpdateSurveyAnswersRequest = { step: 0, data: [] }
    const p = prisma.user.findFirstOrThrow({ where: { email: 'parent1@gmail.com' } })
    const p2 = prisma.user.findFirstOrThrow({ where: { email: 'parent2@gmail.com' } })
    const answers = ''
    new SurveysController().updateSurveyAnswers(null, { step: 0 })
  })
})
