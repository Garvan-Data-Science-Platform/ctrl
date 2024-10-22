import request from 'supertest'
import { Api } from '../../src/Api'

enum HttpMethod {
  GET = 'get',
  POST = 'post',
  PATCH = 'patch',
  DELETE = 'delete',
}

const api = new Api()
const app = api.app

describe('Api', () => {
  beforeAll(async () => {
    api.run()
  })

  afterAll(async () => {
    api.stop()
  })

  describe('Protected Routes', () => {
    const checkProtectedRoute = async (method: HttpMethod, url: string) => {
      const response = await request(app)[method](url)
      expect(response.status).toBe(401)

      const body = response.body
      expect(body.message).toBe('No token provided')
    }

    const userRoutes = [
      { method: HttpMethod.GET, url: '/users' },
      { method: HttpMethod.GET, url: '/users/1' },
      { method: HttpMethod.PATCH, url: '/users/1' },
      { method: HttpMethod.DELETE, url: '/users/1' },
    ]

    const organisationRoutes = [
      { method: HttpMethod.GET, url: '/organisations' },
      { method: HttpMethod.GET, url: '/organisations/1' },
      { method: HttpMethod.POST, url: '/organisations' },
      { method: HttpMethod.PATCH, url: '/organisations/1' },
      { method: HttpMethod.DELETE, url: '/organisations/1' },
      { method: HttpMethod.GET, url: '/organisations/1/users' },
      { method: HttpMethod.POST, url: '/organisations/1/users/2' },
      { method: HttpMethod.DELETE, url: '/organisations/1/users/2' },
    ]

    describe('User Routes', () => {
      userRoutes.forEach(({ method, url }) => {
        it(`${method.toUpperCase()} ${url} should be a protected route`, async () => {
          await checkProtectedRoute(method, url)
        })
      })
    })

    describe('Organisation Routes', () => {
      organisationRoutes.forEach(({ method, url }) => {
        it(`${method.toUpperCase()} ${url} should be a protected route`, async () => {
          await checkProtectedRoute(method, url)
        })
      })
    })
  })
})
