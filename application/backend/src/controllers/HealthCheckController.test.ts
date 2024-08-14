import { HealthCheckController } from './HealthCheckController'

describe('HealthCheckController', () => {
  let controller: HealthCheckController

  beforeEach(() => {
    controller = new HealthCheckController()
  })

  describe('HealthCheck', () => {
    it('should return healthy message', async () => {
      const result = await controller.HealthCheck()
      expect(result).toEqual({ message: 'API is healthy' })
    })
  })

  describe('getAllWorkspaces', () => {
    it('should return all workspaces', async () => {
      const result = await controller.getAllWorkspaces()
      expect(result).toEqual({
        message: 'Getting workspaces',
        data: [
          { name: 'backend', version: '1.0.0' },
          { name: 'common', version: '1.0.0' },
          { name: 'frontend', version: '1.0.0' },
        ],
      })
    })
  })
})
