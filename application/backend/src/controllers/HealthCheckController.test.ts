import request from 'supertest'
import { Api } from '../Api'

describe('HealthCheckController', () => {
  const app = new Api().app

  describe('HealthCheck', () => {
    it('should return healthy message', async () => {
      const response = await request(app).get('/')
      expect(response.status).toBe(200)
    })
  })
})
