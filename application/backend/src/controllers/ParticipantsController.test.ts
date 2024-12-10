import { generateToken } from '../authentication'
import { Api } from '../Api'
import { resetDB } from '../../tests/TestHelpers'
import request from 'supertest'
import { GetParticipantsResponse } from 'common/types/api/participants'

const api = new Api()
const app = api.app

describe('ParticipantsController', () => {
  let registeredUserToken: string
  const registeredUserId: number = 97
  beforeAll(async () => {
    registeredUserToken = await generateToken({
      userId: registeredUserId,
      roles: ['OrganisationAdmin'],
    })

    api.run()
  })

  beforeEach(async () => {
    await resetDB()
  })

  afterAll(async () => {
    api.stop()
  })

  describe('GET /participants', () => {
    it('Returns participant list', async () => {
      const response = await request(app)
        .get('/participants')
        .set({ Authorization: `Bearer ${registeredUserToken}` })
      const body: GetParticipantsResponse = response.body
      expect(response.status).toBe(200)

      console.log('BODY', body)
      expect(body.data).toHaveLength(2)
      expect(body.data[0]).not.toHaveProperty('lastUpdated')
      expect(['03/12/2024', '12/2/2024']).toContain(body.data[1].lastUpdated)
      expect(body.data[1].answers).toHaveLength(1)
      expect(body.data[1].answers[0].status).toBe('incomplete')
    })
  })
})
