import request from 'supertest'
import { resetDB } from 'common/testing/TestHelpers'
import { Api } from '../Api'
import { generateToken } from '../authentication'
import prisma from '../PrismaClient'
import { PARTICIPANT_COMPLETED_ID } from 'common/testing/seed'
import { redcapFetch } from '../../tests/__mocks__/RedcapFetch'
import path from 'path'

const api = new Api()
const app = api.app
let token: string

describe('IntegrationsController', () => {
  beforeAll(async () => {
    token = await generateToken({ userId: PARTICIPANT_COMPLETED_ID, roles: ['OrganisationAdmin'] })
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

  describe('POST /integrations/redcap/participant/upload/csv', () => {
    it('should create a new participant from a given csv', async () => {
      const csvPath = path.resolve(__dirname, '../../tests/test_data/one_user.csv')
      const response = await request(app)
        .post('/integrations/redcap/participant/upload/csv')
        .set({ Authorization: `Bearer ${token}` })
        .attach('file', csvPath) // Attach the file with the field name 'file'

      expect(response.status).toBe(201)

      expect(response.body).toStrictEqual({
        profilesCreatedCount: 1,
        ids: [1],
        profilesAlreadyExistedCount: 0,
      })

      const createdParticipant = await prisma.participantProfile.findFirst({
        where: { firstName: 'John' },
      })

      expect(createdParticipant).not.toBe(null)
    })
    it('should register multiple users from one csv', async () => {
      const initialLen = await prisma.participantProfile.count()

      const csvPath = path.resolve(__dirname, '../../tests/test_data/90_users.csv')
      const response = await request(app)
        .post('/integrations/redcap/participant/upload/csv')
        .set({ Authorization: `Bearer ${token}` })
        .attach('file', csvPath) // Attach the file with the field name 'file'

      expect(response.status).toBe(201)

      const postCreationLen = await prisma.participantProfile.count()

      expect(postCreationLen - initialLen).toBe(90) // test still passes if db seed changes

      expect(response.body.ids.length).toBe(90)
    }, 15000)

    it('should not create a profile for details that already have a user', async () => {
      const user = await prisma.user.create({
        data: {
          firstName: 'John',
          lastName: 'Smith',
          email: 'example@example.com',
          password: 'password',
        },
      })

      await prisma.participantProfile.create({
        data: {
          firstName: 'John',
          lastName: 'Smith',
          dob: new Date('1990-01-01'),
          mobile: '1234567890',
          addressLine: '123 Main St',
          suburb: 'Anytown',
          state: 'NSW',
          postcode: '12345',
          participantType: 'STANDARD',
          preferredContact: 'EMAIL',
          user: { connect: { id: user.id } },
        },
      })

      const csvPath = path.resolve(__dirname, '../../tests/test_data/one_user.csv')

      const response = await request(app)
        .post('/integrations/redcap/participant/upload/csv')
        .set({ Authorization: `Bearer ${token}` })
        .attach('file', csvPath)

      expect(response.status).toBe(201)

      expect(response.body.profilesAlreadyExistedCount).toBe(1)
    }, 15000)

    it('should throw a 400 error if no file is given', async () => {
      const response = await request(app)
        .post('/integrations/redcap/participant/upload/csv')
        .set({ Authorization: `Bearer ${token}` })
      expect(response.status).toBe(400)
      const body = response.body
      expect(body.message).toBe("Cannot read properties of undefined (reading 'file')")
    })

    it('should throw a 400 error if given an empty file', async () => {
      const csvPath = path.resolve(__dirname, '../../tests/test_data/empty_file.csv')
      const response = await request(app)
        .post('/integrations/redcap/participant/upload/csv')
        .set({ Authorization: `Bearer ${token}` })
        .attach('file', csvPath)
      expect(response.status).toBe(400)
      const body = response.body
      expect(body.message).toBe('File is empty')
    })

    it('should throw an error if the file is not a csv', async () => {
      const csvPath = path.resolve(__dirname, '../../tests/test_data/not_a_csv.txt')
      const response = await request(app)
        .post('/integrations/redcap/participant/upload/csv')
        .set({ Authorization: `Bearer ${token}` })
        .attach('file', csvPath)
      expect(response.status).toBe(400)
    })
  })

  describe('POST integrations/redcap/instrument/upload/csv', () => {
    it('should update a valid draft survey from instrument csv', async () => {
      const csvPath = path.resolve(__dirname, '../../tests/test_data/instrument.csv')
      const response = await request(app)
        .post('/integrations/redcap/instrument/upload/csv')
        .set({ Authorization: `Bearer ${token}` })
        .attach('file', csvPath)
      expect(response.status).toBe(201)

      // updates the pre-existing draft survey
      expect(response.body.id).toBe(2)

      const survey = await prisma.surveyVersion.findFirst({ where: { id: 2 } })

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

    it('should create a new draft survey if one doesnt already exist', async () => {
      // In the seed data the second seed is the draft survey - we remove it to test creating a new survey
      await prisma.surveyVersion.update({ where: { id: 2 }, data: { status: 'PUBLISHED' } })

      const csvPath = path.resolve(__dirname, '../../tests/test_data/instrument.csv')
      const response = await request(app)
        .post('/integrations/redcap/instrument/upload/csv')
        .set({ Authorization: `Bearer ${token}` })
        .attach('file', csvPath)
      expect(response.status).toBe(201)

      // creates a new draft survey
      expect(response.body.id).toBe(3)

      // should create a new draft survey!
      const survey = await prisma.surveyVersion.findFirst({ where: { id: 3 } })

      expect(survey?.data.length).toBe(4)
    })

    it('should throw a 400 error if no file is given', async () => {
      const response = await request(app)
        .post('/integrations/redcap/instrument/upload/csv')
        .set({ Authorization: `Bearer ${token}` })
      expect(response.status).toBe(400)
      expect(response.body.message).toBe("Cannot read properties of undefined (reading 'file')")
    })

    it('should throw a 404 error if given an empty file', async () => {
      const csvPath = path.resolve(__dirname, '../../tests/test_data/empty_file.csv')
      const response = await request(app)
        .post('/integrations/redcap/instrument/upload/csv')
        .set({ Authorization: `Bearer ${token}` })
        .attach('file', csvPath)
      expect(response.status).toBe(400)
      expect(response.body.message).toBe('File is empty')
    })

    it('should throw a 400 error if the file is not a csv', async () => {
      const csvPath = path.resolve(__dirname, '../../tests/test_data/not_a_csv.txt')
      const response = await request(app)
        .post('/integrations/redcap/instrument/upload/csv')
        .set({ Authorization: `Bearer ${token}` })
        .attach('file', csvPath)
      expect(response.status).toBe(400)
    })
  })

  describe('POST integrations/redcap/participant/upload/api', () => {
    it('should register multiple users from one api call', async () => {
      const initialLen = await prisma.participantProfile.count()

      const response = await request(app)
        .post('/integrations/redcap/participant/upload/api')
        .send({ form: 'ctrl_test_1' })
        .set({ Authorization: `Bearer ${token}` })

      expect(response.status).toBe(201)

      const postCreationLen = await prisma.participantProfile.count()

      expect(postCreationLen - initialLen).toBe(10) // adds the 10 users in ctrl_test_1

      // check correct response message
      expect(response.body.ids.length).toBe(10)
    })

    it('should return a BadGatewayErorr if the api is offline, or unavailable when adding participants', async () => {
      jest
        .spyOn(global, 'fetch')
        .mockRejectedValueOnce({ message: 'API offline or unavailable', status: 500 })

      const response = await request(app)
        .post('/integrations/redcap/participant/upload/api')
        .send({ form: 'ctrl_test_1' })
        .set({ Authorization: `Bearer ${token}` })

      expect(response.status).toBe(502)
    })
  })

  describe('POST integrations/redcap/instrument/upload/api', () => {
    it('should create a survey when given a form using the redcap api', async () => {
      const response = await request(app)
        .post('/integrations/redcap/instrument/upload/api')
        .send({ form: 'ctrl_test_2' })
        .set({ Authorization: `Bearer ${token}` })
      expect(response.status).toBe(201)
      const survey = await prisma.surveyVersion.findFirst({ where: { id: 2 } })

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

    it('should create a new draft survey if one doesnt already exist using the redcap api', async () => {
      // In the seed data the second seed is the draft survey - we remove it to test creating a new survey
      await prisma.surveyVersion.update({ where: { id: 2 }, data: { status: 'PUBLISHED' } })

      const response = await request(app)
        .post('/integrations/redcap/instrument/upload/api')
        .send({ form: 'ctrl_test_2' })
        .set({ Authorization: `Bearer ${token}` })
      expect(response.status).toBe(201)

      // creates a new draft survey
      expect(response.body.id).toBe(3)

      // should create a new draft survey!
      const survey = await prisma.surveyVersion.findFirst({ where: { id: 3 } })

      expect(survey?.data[0].elements[1]).toStrictEqual({
        data: {
          choices: ['0. test', '1. testing', '2. testing again'],
          text: 'TEST checkbox',
          value: '0. test',
        },
        type: 'question-choices',
      })
    })

    it('should throw an error if no form is given', async () => {
      const response = await request(app)
        .post('/integrations/redcap/instrument/upload/api/')
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
        .post('/integrations/redcap/instrument/upload/api')
        .send({ form: 'ctrl_test_1' })
        .set({ Authorization: `Bearer ${token}` })

      expect(response.status).toBe(502)
    })
  })
})
