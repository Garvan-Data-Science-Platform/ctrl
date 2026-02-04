import request from 'supertest'
import { resetDB } from 'common/testing/TestHelpers'
import { Api } from '../Api'
import { generateToken } from '../authentication'
import prisma from '../PrismaClient'
import {
  FE_TEST_STUDY_ID,
  ORG_ADMIN_ID,
  PARTICIPANT_COMPLETED_ID,
  PARTICIPANT_UNANSWERED_ID,
} from 'common/testing/seed'
import { redcapFetch } from '../../tests/__mocks__/RedcapFetch'
import path from 'path'
import { SurveysController } from './SurveysController'

const api = new Api()
const app = api.app
let token: string

describe('IntegrationsController', () => {
  beforeAll(async () => {
    token = await generateToken({ userId: ORG_ADMIN_ID })
    api.run()
  })

  beforeEach(async () => {
    // mock implementation for fetch - specifically for calls to the redcap api
    jest.spyOn(global, 'fetch').mockImplementation(redcapFetch)
    await resetDB()
  })

  afterEach(async () => {
    jest.restoreAllMocks()
  })

  afterAll(async () => {
    api.stop()
  })

  describe('POST /studies/{studyId}/integrations/redcap/participant/upload/csv', () => {
    it('should return a list of existing users and new invites from a given csv', async () => {
      const studyId = 1
      const csvPath = path.resolve(__dirname, '../../tests/test_data/one_user.csv')
      const response = await request(app)
        .post(`/studies/${studyId}/integrations/redcap/participant/upload/csv`)
        .set({ Authorization: `Bearer ${token}` })
        .attach('file', csvPath) // Attach the file with the field name 'file'

      expect(response.status).toBe(201)

      expect(response.body).toStrictEqual({
        existingUsers: [],
        newParticipants: [
          {
            email: 'example@example.com',
            prefill: {
              profile: {
                addressLine: '2 fake st',
                dob: '01/10/1984',
                firstName: 'John',
                lastName: 'Smith',
                mobile: '0448434946',
                nextOfKin: {
                  email: 'example2@example.com',
                  firstName: 'fake',
                  lastName: 'fakerson',
                  mobile: '0448434946',
                },
                participantType: 'STANDARD',
                postcode: '2010',
                preferredContact: 'EMAIL',
                state: 'ACT',
                suburb: 'fakie',
              },
              studyParticipant: {
                externalId: '1',
              },
            },
          },
        ],
      })
    })

    it('should register multiple users from one csv', async () => {
      const studyId = 1
      const csvPath = path.resolve(__dirname, '../../tests/test_data/90_users.csv')

      const response = await request(app)
        .post(`/studies/${studyId}/integrations/redcap/participant/upload/csv`)
        .set({ Authorization: `Bearer ${token}` })
        .attach('file', csvPath) // Attach the file with the field name 'file'

      expect(response.status).toBe(201)

      expect(response.body.newParticipants.length).toBe(90)
    }, 15000)

    it('should not return an email that already has a user in that study', async () => {
      const studyId = 1
      const csvPath = path.resolve(__dirname, '../../tests/test_data/one_user.csv')

      const response0 = await request(app)
        .post(`/studies/${studyId}/integrations/redcap/participant/upload/csv`)
        .set({ Authorization: `Bearer ${token}` })
        .attach('file', csvPath)

      expect(response0.status).toBe(201)
      expect(response0.body.newParticipants.length).toBe(1)

      // Create the user and participant profile that matches the csv upload
      const user = await prisma.user.create({
        data: {
          firstName: 'John',
          lastName: 'Smith',
          email: 'example@example.com',
          password: 'Testpassword1',
        },
      })

      await prisma.participantProfile.create({
        data: {
          firstName: 'John',
          lastName: 'Smith',
          dob: '1990-01-01',
          mobile: '1234567890',
          addressLine: '123 Main St',
          suburb: 'Anytown',
          state: 'NSW',
          postcode: '12345',
          studies: {
            create: {
              study: {
                connect: {
                  id: studyId,
                },
              },
            },
          },
          participantType: 'STANDARD',
          preferredContact: 'EMAIL',
          user: { connect: { id: user.id } },
        },
      })

      const response1 = await request(app)
        .post(`/studies/${studyId}/integrations/redcap/participant/upload/csv`)
        .set({ Authorization: `Bearer ${token}` })
        .attach('file', csvPath)

      expect(response1.status).toBe(201)
      expect(response1.body.newParticipants.length).toBe(0)
      expect(response1.body.existingUsers.length).toBe(1)
    }, 15000)

    it('should throw a 400 error if no file is given', async () => {
      const response = await request(app)
        .post('/studies/1/integrations/redcap/participant/upload/csv')
        .set({ Authorization: `Bearer ${token}` })
      expect(response.status).toBe(400)
      const body = response.body
      expect(body.message).toBe("Cannot read properties of undefined (reading 'file')")
    })

    it('should throw a 400 error if given an empty file', async () => {
      const csvPath = path.resolve(__dirname, '../../tests/test_data/empty_file.csv')
      const response = await request(app)
        .post('/studies/1/integrations/redcap/participant/upload/csv')
        .set({ Authorization: `Bearer ${token}` })
        .attach('file', csvPath)
      expect(response.status).toBe(400)
      const body = response.body
      expect(body.message).toBe('File is empty')
    })

    it('should throw an error if the file is not a csv', async () => {
      const csvPath = path.resolve(__dirname, '../../tests/test_data/not_a_csv.txt')
      const response = await request(app)
        .post('/studies/1/integrations/redcap/participant/upload/csv')
        .set({ Authorization: `Bearer ${token}` })
        .attach('file', csvPath)
      expect(response.status).toBe(400)
    })
  })

  describe('POST studies/{studyId}/integrations/redcap/instrument/upload/csv', () => {
    it('should update a valid draft survey from instrument csv', async () => {
      const studyId = 1
      const csvPath = path.resolve(__dirname, '../../tests/test_data/instrument.csv')
      const response = await request(app)
        .post(`/studies/${studyId}/integrations/redcap/instrument/upload/csv`)
        .set({ Authorization: `Bearer ${token}` })
        .attach('file', csvPath)
      expect(response.status).toBe(201)

      // updates the pre-existing draft survey
      expect(response.body.versionNumber).toBe(2)

      const survey = await prisma.surveyVersion.findFirst({
        where: {
          versionNumber: 2,
          studyId: studyId,
        },
      })

      // test that subheading type converts into the heading of a survey step
      expect(survey?.data[0].title).toStrictEqual('Contact')

      // test question-choices survey type
      expect(survey?.data[0].elements[0]).toStrictEqual({
        data: {
          choices: ['Yes', 'No'],
          text: 'Participant has requested no further contact about CTRL',
          value: 'Yes',
        },
        type: 'question-choices',
      })

      // text question-checkbox survey type
      expect(survey?.data[2].elements[11]).toStrictEqual({
        data: {
          text: 'I agree to Australian Genomics sharing my contact details with other research projects and clinical trials doing studies I am eligible for.',
          value: false,
        },
        type: 'question-checkbox',
      })

      expect(survey?.data.length).toBe(4)
    })

    it('should throw a 400 error if no file is given', async () => {
      const response = await request(app)
        .post('/studies/1/integrations/redcap/instrument/upload/csv')
        .set({ Authorization: `Bearer ${token}` })
      expect(response.status).toBe(400)
      expect(response.body.message).toBe("Cannot read properties of undefined (reading 'file')")
    })

    it('should throw a 404 error if given an empty file', async () => {
      const csvPath = path.resolve(__dirname, '../../tests/test_data/empty_file.csv')
      const response = await request(app)
        .post('/studies/1/integrations/redcap/instrument/upload/csv')
        .set({ Authorization: `Bearer ${token}` })
        .attach('file', csvPath)
      expect(response.status).toBe(400)
      expect(response.body.message).toBe('File is empty')
    })

    it('should throw a 400 error if the file is not a csv', async () => {
      const csvPath = path.resolve(__dirname, '../../tests/test_data/not_a_csv.txt')
      const response = await request(app)
        .post('/studies/1/integrations/redcap/instrument/upload/csv')
        .set({ Authorization: `Bearer ${token}` })
        .attach('file', csvPath)
      expect(response.status).toBe(400)
    })

    it('should throw an error if the studyId does not exist', async () => {
      const response = await request(app)
        .post('/studies/999/integrations/redcap/participant/upload/api')
        .set({ Authorization: `Bearer ${token}` })

      expect(response.status).toBe(404)
      expect(response.body.message).toBe('Study with id 999 not found')
    })
  })

  describe('POST /studies/{studyId}/integrations/redcap/participant/upload/api', () => {
    it('should return a list of emails to be invited to the study', async () => {
      const studyId = 1

      const response = await request(app)
        .post(`/studies/${studyId}/integrations/redcap/participant/upload/api`)
        .set({ Authorization: `Bearer ${token}` })
      expect(response.status).toBe(201)

      console.log('RESPONSE TEST', response.body)

      // check correct response message
      expect(response.body.newParticipants.length).toBe(10)
    })

    it('should return a BadGatewayError if the api is offline, or unavailable when adding participants', async () => {
      jest
        .spyOn(global, 'fetch')
        .mockRejectedValueOnce({ message: 'API offline or unavailable', status: 500 })

      const studyId = 1

      const response = await request(app)
        .post(`/studies/${studyId}/integrations/redcap/participant/upload/api`)
        .set({ Authorization: `Bearer ${token}` })

      expect(response.status).toBe(502)
    })

    it('should throw an error if the studyId does not exist', async () => {
      const response = await request(app)
        .post('/studies/999/integrations/redcap/participant/upload/api')
        .set({ Authorization: `Bearer ${token}` })

      expect(response.status).toBe(404)
      expect(response.body.message).toBe('Study with id 999 not found')
    })
  })

  describe('POST /studies/{studyId}/integrations/redcap/instrument/upload/api', () => {
    it('should create a survey when given a form using the redcap api', async () => {
      const studyId = 1
      const response = await request(app)
        .post(`/studies/${studyId}/integrations/redcap/instrument/upload/api`)
        .send({ formName: 'ctrl_test_2' })
        .set({ Authorization: `Bearer ${token}` })
      expect(response.status).toBe(201)
      const survey = await prisma.surveyVersion.findFirst({
        where: {
          id: 1,
          studyId: studyId,
        },
      })

      expect(survey?.data[0].elements[1]).toStrictEqual({
        data: {
          choices: ['0. test', '1. testing', '2. testing again'],
          text: 'TEST checkbox',
          value: '0. test',
        },
        type: 'question-choices',
      })
      expect(survey?.data[0].elements.length).toBe(2)
    })

    it('should throw an error if no form is given', async () => {
      const response = await request(app)
        .post('/studies/1/integrations/redcap/instrument/upload/api/')
        .send({})
        .set({ Authorization: `Bearer ${token}` })
      expect(response.status).toBe(422)
      expect(response.body.message).toBe('Validation Failed')
    })

    it('should return a BadGatewayErorr if the api is offline, or unavailable when creating a survey', async () => {
      jest
        .spyOn(global, 'fetch')
        .mockRejectedValueOnce({ message: 'API offline or unavailable', status: 500 })

      const response = await request(app)
        .post('/studies/1/integrations/redcap/instrument/upload/api')
        .send({ formName: 'ctrl_test_1' })
        .set({ Authorization: `Bearer ${token}` })

      expect(response.status).toBe(502)
    })
  })

  describe('POST /elsa/duos', () => {
    /*
    Relevant seed data
    Study 1 survey
    Q1
      { "code": "DUO:0000001", "relatedAnswer": true },
      { "code": "DUO:0000002", "relatedAnswer": false }

    Q2
      { "code": "DUO:0000003", "relatedAnswer": "Choice 1" }

    PARTICIPANT_COMPLETED
      answers: [false, 'Choice 2'],

    PARTICIPANT_UNANSWERED
      answers: [null, null]
    */

    it('Returns 401 for missing or incorrect API Key', async () => {
      const res1 = await request(app).post('/elsa/duos')
      expect(res1.status).toBe(422)
      const res2 = await request(app)
        .post('/elsa/duos')
        .send({ participantIds: [] })
        .set({ Authorization: 'Apikey 123' })
      expect(res2.status).toBe(401)
    })

    it('Returns list of Not Found ParticipantIds', async () => {
      const res = await request(app)
        .post('/elsa/duos')
        .set({ Authorization: 'Apikey abc123' })
        .send({ participantIds: [`PID-TEST1-${PARTICIPANT_COMPLETED_ID}`, 'dummy'] })
      expect(res.body.notFoundIds).toEqual(['dummy'])
    })

    it('Returns correct DUO code for participant who has answered', async () => {
      const res = await request(app)
        .post('/elsa/duos')
        .set({ Authorization: 'Apikey abc123' })
        .send({
          participantIds: [
            `PID-TEST1-${PARTICIPANT_COMPLETED_ID}`,
            `PID-TEST1-${PARTICIPANT_UNANSWERED_ID}`,
          ],
        })

      //Correct when two duos apply to same question
      //Does not return code for question with wrong answer (Choice 2)
      expect(res.body.data[0].duos).toEqual(['DUO:0000006'])
      expect(res.body.data).toHaveLength(2)
    })

    it('null does not count as false', async () => {
      const res = await request(app)
        .post('/elsa/duos')
        .set({ Authorization: 'Apikey abc123' })
        .send({ participantIds: [`PID-TEST1-${PARTICIPANT_UNANSWERED_ID}`] })
      expect(res.body.data[0].duos).toEqual([])
    })

    it('DUO codes work with multi studies', async () => {
      const sva = await prisma.surveyVersionAnswers.findFirstOrThrow({
        where: {
          version: { studyId: FE_TEST_STUDY_ID },
          profileId: PARTICIPANT_UNANSWERED_ID,
        },
        orderBy: { version: { versionNumber: 'desc' } },
      })
      await prisma.surveyVersionAnswers.update({
        where: { id: sva.id },
        data: { answers: [{ status: 'review_required', answers: [true] }] },
      })

      const res = await request(app)
        .post('/elsa/duos')
        .set({ Authorization: 'Apikey abc123' })
        .send({ participantIds: [`PID-TEST2-${PARTICIPANT_UNANSWERED_ID}`] })
      expect(res.body.data[0].duos).toEqual(['DUO:0000004'])
    })

    it('DUO code is maintained when a new version is published and answer is carried over', async () => {
      await new SurveysController().publishSurvey(1, 2)

      const res = await request(app)
        .post('/elsa/duos')
        .set({ Authorization: 'Apikey abc123' })
        .send({ participantIds: [`PID-TEST1-${PARTICIPANT_COMPLETED_ID}`] })
      expect(res.body.data[0].duos).toEqual(['DUO:0000006'])
    })
  })
})
