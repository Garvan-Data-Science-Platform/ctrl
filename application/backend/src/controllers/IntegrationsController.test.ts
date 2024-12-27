import request from 'supertest'
import { resetDB } from 'common/testing/TestHelpers'
import { Api } from '../Api'
import path from 'path'
import { generateToken } from '../authentication'
import { UploadRedcapParticipantResponse } from 'common/types/api/integrations/redcap'
import prisma from '../PrismaClient'
import { PARTICIPANT_COMPLETED_ID } from 'common/testing/seed'

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
      const csvPath = path.resolve(__dirname, '../../tests/test_data/one_user.csv')
      const response = await request(app)
        .post('/integrations/redcap/participant/upload')
        .set({ Authorization: `Bearer ${token}` })
        .attach('file', csvPath) // Attach the file with the field name 'file'

      expect(response.status).toBe(201)

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
    }, 15000)

    it('should throw a 404 error if no file is given', async () => {
      const response = await request(app)
        .post('/integrations/redcap/participant/upload')
        .set({ Authorization: `Bearer ${token}` })
      expect(response.status).toBe(400)
      const body: UploadRedcapParticipantResponse = response.body
      expect(body.message).toBe('No file uploaded')
    })

    it('should throw a 404 error if given an empty file', async () => {
      const csvPath = path.resolve(__dirname, '../../tests/test_data/empty_file.csv')
      const response = await request(app)
        .post('/integrations/redcap/participant/upload')
        .set({ Authorization: `Bearer ${token}` })
        .attach('file', csvPath)
      expect(response.status).toBe(400)
      const body: UploadRedcapParticipantResponse = response.body
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

  describe('POST /redcap/instrument/upload', () => {
    it('should be used for testing', async () => {
      const csvPath = path.resolve(__dirname, '../../tests/test_data/instrument.csv')
      const response = await request(app)
        .post('/integrations/redcap/instrument/upload')
        .set({ Authorization: `Bearer ${token}` })
        .attach('file', csvPath)
      expect(response.status).toBe(200)
      const survey = await prisma.surveyVersion.findFirst({ where: { id: 3 } })
      expect(survey?.data[0].elements[1]).toStrictEqual({
        data: {
          choices: ['Yes', 'No'],
          text: 'Participant has requested no further contact about CTRL',
          value: 'Yes',
        },
        type: 'question-choices',
      })
      expect(survey?.data[0].elements.length).toBe(25)
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

    it('should throw an error if the file is not a csv', async () => {
      const csvPath = path.resolve(__dirname, '../../tests/test_data/not_a_csv.txt')
      const response = await request(app)
        .post('/integrations/redcap/instrument/upload')
        .set({ Authorization: `Bearer ${token}` })
        .attach('file', csvPath)
      expect(response.status).toBe(400)
    })
  })
})
