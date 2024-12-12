import request from 'supertest'
import { resetDB } from '../../tests/TestHelpers'
import { Api } from '../Api'
import path from 'path'
import { generateToken } from '../authentication'
import { UploadRedCapParticipantsResponse } from 'common/types/api/integrations/redcap'

const api = new Api()
const app = api.app
let token: string

describe('IntegrationsController', () => {
  beforeAll(async () => {
    token = await generateToken({ userId: 99, roles: ['OrganisationAdmin'] })
    api.run()
  })

  beforeEach(async () => {
    await resetDB()
  })

  afterAll(async () => {
    api.stop()
  })

  describe('POST /integrations/redcap/participant/upload', () => {
    it('should register a new user from a given csv', async () => {
      const csvPath = path.resolve(__dirname, '../../tests/test_data/one_user.csv')
      const response = await request(app)
        .post('/integrations/redcap/participant/upload')
        .set({ Authorization: `Bearer ${token}` })
        .attach('file', csvPath) // Attach the file with the field name 'file'

      expect(response.status).toBe(200)
      expect(response.body.message).toBe('created 1 participants')

      const list = await request(app)
        .get('/participants')
        .set({ Authorization: `Bearer ${token}` })

      // user is actually added
      expect(list.body.data[3].firstName).toBe('John')
      expect(list.body.data[3].lastName).toBe('Smith')
    })

    it('should register multiple users from one csv', async () => {
      const initialList = await request(app)
        .get('/participants')
        .set({ Authorization: `Bearer ${token}` })
      const initialLen = initialList.body.data.length

      const csvPath = path.resolve(__dirname, '../../tests/test_data/90_users.csv')
      const response = await request(app)
        .post('/integrations/redcap/participant/upload')
        .set({ Authorization: `Bearer ${token}` })
        .attach('file', csvPath) // Attach the file with the field name 'file'

      expect(response.status).toBe(200)
      expect(response.body.message).toBe('created 90 participants')

      const postCreationList = await request(app)
        .get('/participants')
        .set({ Authorization: `Bearer ${token}` })
      const postCreationLen = postCreationList.body.data.length

      expect(postCreationLen - initialLen).toBe(90) // test still passes if db seed changes
    }, 15000)

    it('should throw a 404 error if no file is given', async () => {
      const response = await request(app)
        .post('/integrations/redcap/participant/upload')
        .set({ Authorization: `Bearer ${token}` })
      expect(response.status).toBe(404)
      const body: UploadRedCapParticipantsResponse = response.body
      expect(body.message).toBe('No file uploaded')
    })

    it('should throw a 404 error if given an empty file', async () => {
      const csvPath = path.resolve(__dirname, '../../tests/test_data/empty_file.csv')
      const response = await request(app)
        .post('/integrations/redcap/participant/upload')
        .set({ Authorization: `Bearer ${token}` })
        .attach('file', csvPath)
      expect(response.status).toBe(404)
      const body: UploadRedCapParticipantsResponse = response.body
      expect(body.message).toBe('File is empty')
    })

    it('should throw an error if the file is not a csv', async () => {
      const csvPath = path.resolve(__dirname, '../../tests/test_data/not_a_csv.txt')
      const response = await request(app)
        .post('/integrations/redcap/participant/upload')
        .set({ Authorization: `Bearer ${token}` })
        .attach('file', csvPath)
      expect(response.status).toBe(500)
    })
  })
})
