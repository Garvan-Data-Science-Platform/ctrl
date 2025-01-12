import { generateToken } from '../authentication'
import { Api } from '../Api'
import { resetDB } from 'common/testing/TestHelpers'
import request from 'supertest'
import { GetParticipantsResponse } from 'common/types/api/participants'
import { ORG_ADMIN_ID } from 'common/testing/seed'

const api = new Api()
const app = api.app

describe('ParticipantsController', () => {
  let registeredUserToken: string

  beforeAll(async () => {
    registeredUserToken = await generateToken({
      userId: ORG_ADMIN_ID,
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

      expect(body.data).toHaveLength(2)
      expect(body.data[0]).not.toHaveProperty('lastUpdated')
      expect(['12/3/2024', '12/2/2024']).toContain(body.data[1].lastUpdated)
      expect(body.data[1].answers).toHaveLength(1)
      expect(body.data[1].answers[0].status).toBe('incomplete')
    })
  })
})
