import request from 'supertest'
import { generateToken } from '../../src/authentication'
import { Api } from '../../src/Api'
import { Role } from '@prisma/client'

enum HttpMethod {
  GET = 'get',
  POST = 'post',
  PATCH = 'patch',
  DELETE = 'delete',
}

interface Route {
  method: HttpMethod
  url: string
  rolesWhitelisted: Role[]
}

const api = new Api()
const app = api.app

describe('Protected Routes', () => {
  beforeAll(async () => {
    api.run()
  })

  afterAll(async () => {
    api.stop()
  })

  const checkProtectedRoutes = async (route: Route): Promise<void> => {
    // Check Role Based Route Protection
    const opAdminToken = await generateToken({ userId: 96, roles: [Role.OperatorAdmin] })
    const orgAdminToken = await generateToken({ userId: 97, roles: [Role.OrganisationAdmin] })
    const participantToken = await generateToken({ userId: 98, roles: [Role.Participant] })

    const authHeaders = (token: string) => ({ Authorization: `Bearer ${token}` })

    for (const role in Role) {
      let headers = {}
      if (role == Role.OperatorAdmin) {
        headers = authHeaders(opAdminToken)
      } else if (role == Role.Participant) {
        headers = authHeaders(participantToken)
      } else if (role == Role.OrganisationAdmin) {
        headers = authHeaders(orgAdminToken)
      }

      const response = await request(app)[route.method](route.url).set(headers)

      // Check if role is whitelisted
      if (route.rolesWhitelisted.length == 0 || route.rolesWhitelisted.includes(role as Role)) {
        expect(response.status).not.toBe(401)
      } else {
        expect(response.status).toBe(401)
        expect(response.body.message).toBe('Incorrect Permissions')
      }
    }

    // Check JWT Protected Routes
    const response = await request(app)[route.method](route.url)
    expect(response.status).toBe(401)

    const body = response.body
    expect(body.message).toBe('No token provided')
  }

  const userRoutes: Route[] = [
    {
      method: HttpMethod.GET,
      url: '/users',
      rolesWhitelisted: [Role.OrganisationAdmin],
    },
    {
      method: HttpMethod.GET,
      url: '/users/1',
      rolesWhitelisted: [],
    },
    {
      method: HttpMethod.POST,
      url: '/users',
      rolesWhitelisted: [Role.OrganisationAdmin],
    },
    {
      method: HttpMethod.PATCH,
      url: '/users/1',
      rolesWhitelisted: [Role.OrganisationAdmin],
    },
    {
      method: HttpMethod.PATCH,
      url: '/users/1/role',
      rolesWhitelisted: [Role.OperatorAdmin],
    },
    {
      method: HttpMethod.DELETE,
      url: '/users/1',
      rolesWhitelisted: [Role.OrganisationAdmin],
    },
  ]

  const organisationRoutes: Route[] = [
    {
      method: HttpMethod.GET,
      url: '/organisations',
      rolesWhitelisted: [Role.OrganisationAdmin],
    },
    {
      method: HttpMethod.GET,
      url: '/organisations/1',
      rolesWhitelisted: [Role.OrganisationAdmin],
    },
    {
      method: HttpMethod.POST,
      url: '/organisations',
      rolesWhitelisted: [Role.OrganisationAdmin],
    },
    {
      method: HttpMethod.PATCH,
      url: '/organisations/1',
      rolesWhitelisted: [Role.OrganisationAdmin],
    },
    {
      method: HttpMethod.DELETE,
      url: '/organisations/1',
      rolesWhitelisted: [Role.OrganisationAdmin],
    },
    {
      method: HttpMethod.GET,
      url: '/organisations/1/users',
      rolesWhitelisted: [Role.OrganisationAdmin],
    },
    {
      method: HttpMethod.POST,
      url: '/organisations/1/users/2',
      rolesWhitelisted: [Role.OrganisationAdmin],
    },
    {
      method: HttpMethod.DELETE,
      url: '/organisations/1/users/2',
      rolesWhitelisted: [Role.OrganisationAdmin],
    },
  ]

  const profileRoutes: Route[] = [
    {
      method: HttpMethod.GET,
      url: '/profiles/current',
      rolesWhitelisted: [],
    },
    {
      method: HttpMethod.GET,
      url: '/profiles/user/1',
      rolesWhitelisted: [],
    },
  ]

  const surveyRoutes: Route[] = [
    {
      method: HttpMethod.GET,
      url: '/surveys',
      rolesWhitelisted: [Role.OrganisationAdmin],
    },
    {
      method: HttpMethod.GET,
      url: '/surveys/1',
      rolesWhitelisted: [],
    },
    {
      method: HttpMethod.POST,
      url: '/surveys/participant/1',
      rolesWhitelisted: [Role.OrganisationAdmin],
    },
    {
      method: HttpMethod.GET,
      url: '/surveys/step/1/1',
      rolesWhitelisted: [],
    },
    {
      method: HttpMethod.POST,
      url: '/surveys/answers',
      rolesWhitelisted: [],
    },
    {
      method: HttpMethod.PATCH,
      url: '/surveys/1',
      rolesWhitelisted: [Role.OrganisationAdmin],
    },
    {
      method: HttpMethod.POST,
      url: '/surveys/publish/1',
      rolesWhitelisted: [Role.OrganisationAdmin],
    },
  ]

  describe('User Routes', () => {
    userRoutes.forEach((route: Route) => {
      it(`${route.method.toUpperCase()} ${route.url} should be a protected route`, async () => {
        await checkProtectedRoutes(route)
      })
    })
  })

  describe('Organisation Routes', () => {
    organisationRoutes.forEach((route: Route) => {
      it(`${route.method.toUpperCase()} ${route.url} should be a protected route`, async () => {
        await checkProtectedRoutes(route)
      })
    })
  })

  describe('Survey Routes', () => {
    surveyRoutes.forEach((route: Route) => {
      it(`${route.method.toUpperCase()} ${route.url} should be a protected route`, async () => {
        await checkProtectedRoutes(route)
      })
    })
  })

  describe('Profile Routes', () => {
    profileRoutes.forEach((route: Route) => {
      it(`${route.method.toUpperCase()} ${route.url} should be a protected route`, async () => {
        await checkProtectedRoutes(route)
      })
    })
  })
})
