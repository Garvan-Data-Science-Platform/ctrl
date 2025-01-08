import request from 'supertest'
import { resetDB } from 'common/testing/TestHelpers'
import { Api } from '../Api'
import path from 'path'
import { generateToken } from '../authentication'
import prisma from '../PrismaClient'
import { PARTICIPANT_COMPLETED_ID } from 'common/testing/seed'
const TESTS_PATH = path.resolve(__dirname, '../../tests/test_data')

const api = new Api()
const app = api.app
let token: string

describe('IntegrationsController', () => {
  beforeAll(async () => {
    token = await generateToken({ userId: PARTICIPANT_COMPLETED_ID, roles: ['OrganisationAdmin'] })
    api.run()
  })

  beforeEach(async () => {
    await resetDB()
  })

  afterAll(async () => {
    api.stop()
  })

  describe('POST /integrations/redcap/participant/upload', () => {
    it('should create a new participant from a given csv', async () => {
      const csvPath = path.join(TESTS_PATH, 'one_user.csv')
      const response = await request(app)
        .post('/integrations/redcap/participant/upload')
        .set({ Authorization: `Bearer ${token}` })
        .attach('file', csvPath) // Attach the file with the field name 'file'

      expect(response.status).toBe(201)

      expect(response.body).toStrictEqual({ ids: [1] })

      const createdParticipant = await prisma.participantProfile.findFirst({
        where: { firstName: 'John' },
      })

      expect(createdParticipant).not.toBe(null)
    })
    it('should register multiple users from one csv', async () => {
      const initialLen = await prisma.participantProfile.count()

      const csvPath = path.resolve(__dirname, '../../tests/test_data/90_users.csv')
      const response = await request(app)
        .post('/integrations/redcap/participant/upload')
        .set({ Authorization: `Bearer ${token}` })
        .attach('file', csvPath) // Attach the file with the field name 'file'

      expect(response.status).toBe(201)

      const postCreationLen = await prisma.participantProfile.count()

      expect(postCreationLen - initialLen).toBe(90) // test still passes if db seed changes

      expect(response.body.ids.length).toBe(90)
    }, 15000)

    it('should throw a 404 error if no file is given', async () => {
      const response = await request(app)
        .post('/integrations/redcap/participant/upload')
        .set({ Authorization: `Bearer ${token}` })
      expect(response.status).toBe(400)
      const body = response.body
      expect(body.message).toBe('No file uploaded')
    })

    it('should throw a 404 error if given an empty file', async () => {
      const csvPath = path.resolve(__dirname, '../../tests/test_data/empty_file.csv')
      const response = await request(app)
        .post('/integrations/redcap/participant/upload')
        .set({ Authorization: `Bearer ${token}` })
        .attach('file', csvPath)
      expect(response.status).toBe(400)
      const body = response.body
      expect(body.message).toBe('File is empty')
    })

    it('should throw an error if the file is not a csv', async () => {
      const csvPath = path.resolve(__dirname, '../../tests/test_data/not_a_csv.txt')
      const response = await request(app)
        .post('/integrations/redcap/participant/upload')
        .set({ Authorization: `Bearer ${token}` })
        .attach('file', csvPath)
      expect(response.status).toBe(400)
    })
  })

  describe('POST integrations/redcap/instrument/upload', () => {
    it('should update a valid draft survey from instrument csv', async () => {
      const csvPath = path.resolve(__dirname, '../../tests/test_data/instrument.csv')
      const response = await request(app)
        .post('/integrations/redcap/instrument/upload')
        .set({ Authorization: `Bearer ${token}` })
        .attach('file', csvPath)
      expect(response.status).toBe(200)

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
        .post('/integrations/redcap/instrument/upload')
        .set({ Authorization: `Bearer ${token}` })
        .attach('file', csvPath)
      expect(response.status).toBe(200)

      // creates a new draft survey
      expect(response.body.id).toBe(3)

      // should create a new draft survey!
      const survey = await prisma.surveyVersion.findFirst({ where: { id: 3 } })

      expect(survey?.data.length).toBe(4)
    })

    it('should throw a 404 error if no file is given', async () => {
      const response = await request(app)
        .post('/integrations/redcap/instrument/upload')
        .set({ Authorization: `Bearer ${token}` })
      expect(response.status).toBe(400)
      expect(response.body.message).toBe('No file uploaded')
    })

    it('should throw a 404 error if given an empty file', async () => {
      const csvPath = path.resolve(__dirname, '../../tests/test_data/empty_file.csv')
      const response = await request(app)
        .post('/integrations/redcap/instrument/upload')
        .set({ Authorization: `Bearer ${token}` })
        .attach('file', csvPath)
      expect(response.status).toBe(400)
      expect(response.body.message).toBe('File is empty')
    })

    it('should throw a 400 error if the file is not a csv', async () => {
      const csvPath = path.resolve(__dirname, '../../tests/test_data/not_a_csv.txt')
      const response = await request(app)
        .post('/integrations/redcap/instrument/upload')
        .set({ Authorization: `Bearer ${token}` })
        .attach('file', csvPath)
      expect(response.status).toBe(400)
    })

    it('should throw a 400 error if the csv contents have a missing key header', async () => {
      const csvPath = path.resolve(__dirname, '../../tests/test_data/missing_key_header.csv')
      const response = await request(app)
        .post('/integrations/redcap/instrument/upload')
        .set({ Authorization: `Bearer ${token}` })
        .attach('file', csvPath)
      expect(response.status).toBe(400)
      expect(response.body.message).toBe('Missing headers: "Field Type"')
    })

    it('should throw a 400 error if any record has a missing key field', async () => {
      const csvPath = path.resolve(__dirname, '../../tests/test_data/one_missing_field.csv')
      const response = await request(app)
        .post('/integrations/redcap/instrument/upload')
        .set({ Authorization: `Bearer ${token}` })
        .attach('file', csvPath)

      expect(response.status).toBe(400)
      expect(response.body.message).toBe(
        'Line 2 does not have the same number of columns as the header',
      )
    })

    it('should throw a 400 error if a required field is empty', async () => {
      const csvPath = path.resolve(__dirname, '../../tests/test_data/one_empty_field.csv')
      const response = await request(app)
        .post('/integrations/redcap/instrument/upload')
        .set({ Authorization: `Bearer ${token}` })
        .attach('file', csvPath)
      expect(response.status).toBe(400)
      expect(response.body.message).toBe('Missing required field: Field Type')
    })
  })
})
