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

      expect(body.data).toHaveLength(3)
      expect(body.data[0]).not.toHaveProperty('lastUpdated')
      expect([
        new Date('2024-12-02T02:38:01.195Z').toLocaleDateString(),
        new Date('2024-12-03T02:38:01.195Z').toLocaleDateString(),
      ]).toContain(body.data[1].lastUpdated)
      expect(body.data[1].answers).toHaveLength(1)
      expect(body.data[1].answers[0].status).toBe('complete')
    })
  })
})
