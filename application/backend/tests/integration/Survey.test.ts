import request from 'supertest'
import { generateToken } from '../../src/authentication'
import { Api } from '../../src/Api'
import { resetDB } from '../TestHelpers'
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

const api = new Api()
const app = api.app
let participantToken: string, adminToken: string

describe('Survey tests', () => {
  beforeAll(async () => {
    api.run()
    await resetDB()

    participantToken = await generateToken({ userId: 1, roles: ['Participant'] })
    adminToken = await generateToken({ userId: 98, roles: ['OrganisationAdmin'] })
  })

  afterAll(async () => {
    api.stop()
  })

  it('User registers and sees current survey version', async () => {
    const reqBody: RegisterParticipantRequest = {
      addressLine: 'abc',
      dob: '1990-01-01',
      email: 'abcsdfwefijsdf@gjiodsf.com',
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
      dependents: [],
    }
    const regRes = await request(app).post('/auth/register/participant').send(reqBody)
    expect(regRes.statusCode).toBe(201)

    const res = await request(app)
      .get('/surveys/steps/1')
      .set({ authorization: `Bearer ${participantToken}` })
    expect(res.statusCode).toBe(200)
    const data = res.body as GetUserSurveyStepsResponse
    expect(data.data).toHaveLength(2)
    expect(data.data[0].status).toBe('review_required')
    expect(data.data[1].status).toBe('review_required')

    const res2 = await request(app)
      .get('/surveys/step/1/1')
      .set({ authorization: `Bearer ${participantToken}` })
    const data2 = res2.body as GetUserSurveyStepResponse
    expect(data2.data.total_steps).toBe(2)
    expect(data2.data.elements).toHaveLength(4)
  })

  it('User submits answers and they are visible to survey admin, status is updated accordingly', async () => {
    const reqBody: UpdateSurveyAnswersRequest = { step: 0, data: [] }

    const res = await request(app)
      .post('/surveys/answers/')
      .set({ authorization: `Bearer ${participantToken}` })
      .send(reqBody)

    expect(res.statusCode).toBe(200)

    const res2 = await request(app)
      .get('/surveys/steps/0')
      .set({ authorization: `Bearer ${participantToken}` })
    expect(res2.statusCode).toBe(200)
    const data = res2.body as GetUserSurveyStepsResponse
    expect(data.data[0].status).toBe('viewed')
    expect(data.data[1].status).toBe('review_required')
    expect(data.data[0].last_updated).toBeTruthy()
    expect(data.data[1].last_updated).toBeUndefined()

    const res3 = await request(app)
      .get('/surveys/responses/3') //Participant 3 corresponds to the latests survey
      .set({ authorization: `Bearer ${adminToken}` })
    expect(res3.statusCode).toBe(200)

    const data3 = res3.body as GetResponsesByIdResponse
    expect(data3.data[0].last_updated).toBeTruthy()
    expect(data3.data[1].last_updated).toBeUndefined()

    const res4 = await request(app)
      .get('/participants')
      .set({ authorization: `Bearer ${adminToken}` })

    const data4 = res4.body as GetParticipantsResponse
    expect(data4.data[0].lastUpdated).toBeUndefined()
    expect(data4.data[2].lastUpdated).toBeTruthy()
    expect(data4.data[2].answers[0].status).toBe('partially_complete')
  })

  it('Admin publishes another survey version and user sees new questions, status is correct for admin', async () => {
    const reqBody: UpdateSurveyRequest = {
      data: [
        {
          text: '',
          title: '',
          elements: [
            { type: 'question-checkbox', data: { text: 'Question 1b', value: true } },
            {
              type: 'question-choices',
              data: {
                text: 'Question 2b',
                choices: ['Choice 1b', 'Choice 2b'],
                value: 'Choice 1b',
              },
            },
          ],
        },
        {
          text: '',
          title: '',
          elements: [{ type: 'question-checkbox', data: { text: 'Question 3b', value: true } }],
        },
      ],
    }

    const res1 = await request(app)
      .patch('/surveys/2')
      .set({ authorization: `Bearer ${adminToken}` })
      .send(reqBody)
    expect(res1.statusCode).toBe(200)

    const resPublish = await request(app)
      .post('/surveys/publish/2')
      .set({ authorization: `Bearer ${adminToken}` })
    expect(resPublish.statusCode).toBe(200)

    const res2 = await request(app)
      .get('/surveys/steps/0')
      .set({ authorization: `Bearer ${participantToken}` })
    expect(res2.statusCode).toBe(200)
    const data = res2.body as GetUserSurveyStepsResponse
    expect(data.data[0].status).toBe('review_required')
    expect(data.data[1].status).toBe('review_required')
    expect(data.data[0].last_updated).toBeUndefined()
    expect(data.data[1].last_updated).toBeUndefined()

    const res3 = await request(app)
      .get('/surveys/responses/6')
      .set({ authorization: `Bearer ${adminToken}` })
    expect(res3.statusCode).toBe(200)

    const data3 = res3.body as GetResponsesByIdResponse
    expect(data3.data[0].last_updated).toBeUndefined()
    expect(data3.data[1].last_updated).toBeUndefined()

    const res4 = await request(app)
      .get('/participants')
      .set({ authorization: `Bearer ${adminToken}` })

    const data4 = res4.body as GetParticipantsResponse
    expect(data4.data[2].answers[1].status).toBe('incomplete')
  })

  it('User partially completes new survey, admin sees correct status', async () => {
    const reqBody: UpdateSurveyAnswersRequest = { step: 0, data: [false, 'Choice 1b'] }

    await request(app)
      .post('/surveys/answers/')
      .set({ authorization: `Bearer ${participantToken}` })
      .send(reqBody)

    const res2 = await request(app)
      .get('/participants')
      .set({ authorization: `Bearer ${adminToken}` })

    const data2 = res2.body as GetParticipantsResponse
    expect(data2.data[2].answers[1].status).toBe('partially_complete')
  })

  it('User completes survey, admin and user see correct status and dates', async () => {
    const reqBody: UpdateSurveyAnswersRequest = { step: 1, data: [false] }

    await request(app)
      .post('/surveys/answers/')
      .set({ authorization: `Bearer ${participantToken}` })
      .send(reqBody)

    const res2 = await request(app)
      .get('/participants')
      .set({ authorization: `Bearer ${adminToken}` })

    const data2 = res2.body as GetParticipantsResponse
    expect(data2.data[2].answers[1].status).toBe('complete')

    const res3 = await request(app)
      .get('/surveys/steps/0')
      .set({ authorization: `Bearer ${participantToken}` })
    expect(res3.statusCode).toBe(200)
    const data3 = res3.body as GetUserSurveyStepsResponse
    expect(data3.data[0].status).toBe('completed')
    expect(data3.data[1].status).toBe('completed')
    expect(data3.data[0].last_updated).toBeTruthy()
    expect(data3.data[1].last_updated).toBeTruthy()
  })
})
