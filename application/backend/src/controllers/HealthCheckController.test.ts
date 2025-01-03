import { HealthCheckController } from './HealthCheckController'
import request from 'supertest'
import { Api } from '../Api'

describe('HealthCheckController', () => {
  let controller: HealthCheckController
  const app = new Api().app

  beforeEach(() => {
    controller = new HealthCheckController()
  })

  describe('HealthCheck', () => {
    it('should return healthy message', async () => {
      const response = await request(app).get('/healthcheck')
      expect(response.status).toBe(204)
    })
  })

  describe('getAllWorkspaces', () => {
    it('should return all workspaces', async () => {
      const result = await controller.getAllWorkspaces()
      expect(result).toEqual({
        data: [
          { name: 'backend', version: '1.0.0' },
          { name: 'common', version: '1.0.0' },
          { name: 'frontend', version: '1.0.0' },
        ],
      })
    })
  })
})
