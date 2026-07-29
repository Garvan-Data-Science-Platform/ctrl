import request from 'supertest'
import { generateToken } from '../../src/authentication'
import { Api } from '../../src/Api'
import { Role } from '@prisma/client'
import { resetDB } from 'common/testing/TestHelpers'
import { TestUsers } from 'common/testing/constants'

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
    await resetDB()
  })

  afterAll(async () => {
    api.stop()
  })

  const checkProtectedRoutes = async (route: Route): Promise<void> => {
    // Check Role Based Route Protection
    const opAdminToken = await generateToken({ userId: TestUsers.OPERATOR_ADMIN.id })
    const orgAdminToken = await generateToken({ userId: TestUsers.ORG_ADMIN.id })
    const participantToken = await generateToken({ userId: TestUsers.PARTICIPANT_UNANSWERED.id })

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
      }
    }
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
      rolesWhitelisted: [Role.OrganisationAdmin],
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
    {
      method: HttpMethod.GET,
      url: '/users/admin',
      rolesWhitelisted: [Role.OrganisationAdmin],
    },
  ]

  const studyRoutes: Route[] = [
    {
      method: HttpMethod.GET,
      url: '/studies',
      rolesWhitelisted: [Role.OrganisationAdmin],
    },
    {
      method: HttpMethod.GET,
      url: '/studies/1',
      rolesWhitelisted: [Role.OrganisationAdmin],
    },
    {
      method: HttpMethod.POST,
      url: '/studies',
      rolesWhitelisted: [Role.OrganisationAdmin],
    },
    {
      method: HttpMethod.PATCH,
      url: '/studies/1',
      rolesWhitelisted: [Role.OrganisationAdmin],
    },
    {
      method: HttpMethod.DELETE,
      url: '/studies/1',
      rolesWhitelisted: [Role.OrganisationAdmin],
    },
    {
      method: HttpMethod.GET,
      url: '/studies/list',
      rolesWhitelisted: [Role.Participant],
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
      rolesWhitelisted: [Role.Participant],
    },
    {
      method: HttpMethod.GET,
      url: '/profiles/user/1',
      rolesWhitelisted: [Role.OrganisationAdmin],
    },
    {
      method: HttpMethod.GET,
      url: '/profiles/1',
      rolesWhitelisted: [Role.OrganisationAdmin],
    },
    {
      method: HttpMethod.PATCH,
      url: '/profiles/current',
      rolesWhitelisted: [Role.Participant],
    },
    {
      method: HttpMethod.PATCH,
      url: '/profiles/1',
      rolesWhitelisted: [Role.OrganisationAdmin],
    },
  ]

  const surveyRoutes: Route[] = [
    {
      method: HttpMethod.GET,
      url: '/studies/1/surveys',
      rolesWhitelisted: [Role.OrganisationAdmin],
    },
    {
      method: HttpMethod.GET,
      url: '/studies/1/surveys/published',
      rolesWhitelisted: [Role.OrganisationAdmin],
    },
    {
      method: HttpMethod.PATCH,
      url: '/studies/1/surveys/1',
      rolesWhitelisted: [Role.OrganisationAdmin],
    },
    {
      method: HttpMethod.GET,
      url: '/studies/1/surveys/1',
      rolesWhitelisted: [Role.OrganisationAdmin],
    },
    {
      method: HttpMethod.GET,
      url: '/studies/1/survey-steps',
      rolesWhitelisted: [Role.Participant],
    },
    {
      method: HttpMethod.GET,
      url: '/studies/1/survey-steps/1',
      rolesWhitelisted: [Role.Participant],
    },
    {
      method: HttpMethod.GET,
      url: '/studies/1/survey-answers',
      rolesWhitelisted: [Role.Participant],
    },
    {
      method: HttpMethod.POST,
      url: '/studies/1/survey-answers',
      rolesWhitelisted: [Role.Participant],
    },
    {
      method: HttpMethod.GET,
      url: '/studies/1/surveys/1/participants/answers',
      rolesWhitelisted: [Role.OrganisationAdmin],
    },
    {
      method: HttpMethod.GET,
      url: '/studies/1/surveys/current/participants/1/answers',
      rolesWhitelisted: [Role.OrganisationAdmin],
    },
    {
      method: HttpMethod.POST,
      url: '/studies/1/surveys/1/publish',
      rolesWhitelisted: [Role.OrganisationAdmin],
    },
  ]

  const settingsRoutes: Route[] = [
    {
      method: HttpMethod.GET,
      url: '/settings',
      rolesWhitelisted: [Role.OrganisationAdmin],
    },
    {
      method: HttpMethod.PATCH,
      url: '/settings',
      rolesWhitelisted: [Role.OrganisationAdmin],
    },
    {
      method: HttpMethod.GET,
      url: '/settings/theme',
      rolesWhitelisted: [],
    },
    {
      method: HttpMethod.GET,
      url: '/settings/logo',
      rolesWhitelisted: [],
    },
    {
      method: HttpMethod.POST,
      url: '/settings/logo',
      rolesWhitelisted: [Role.OrganisationAdmin],
    },
  ]

  const mailerRoutes: Route[] = [
    {
      method: HttpMethod.POST,
      url: '/mailer/contact-us',
      rolesWhitelisted: [Role.Participant],
    },
  ]
  const authRoutes: Route[] = [
    {
      method: HttpMethod.POST,
      url: '/auth/register',
      rolesWhitelisted: [Role.OrganisationAdmin],
    },
    {
      method: HttpMethod.GET,
      url: '/auth/setup',
      rolesWhitelisted: [],
    },
    {
      method: HttpMethod.POST,
      url: '/auth/register/setup',
      rolesWhitelisted: [],
    },
    {
      method: HttpMethod.POST,
      url: '/auth/register/participants/1',
      rolesWhitelisted: [],
    },
    {
      method: HttpMethod.POST,
      url: '/auth/login',
      rolesWhitelisted: [],
    },
  ]
  const integrationRoutes: Route[] = [
    {
      method: HttpMethod.POST,
      url: '/studies/1/integrations/redcap/participant/upload/csv',
      rolesWhitelisted: [Role.OrganisationAdmin],
    },
    {
      method: HttpMethod.POST,
      url: '/studies/1/integrations/redcap/participant/upload/api',
      rolesWhitelisted: [Role.OrganisationAdmin],
    },
    {
      method: HttpMethod.POST,
      url: '/studies/1/integrations/redcap/instrument/upload/csv',
      rolesWhitelisted: [Role.OrganisationAdmin],
    },
    {
      method: HttpMethod.POST,
      url: '/studies/1/integrations/redcap/instrument/upload/api',
      rolesWhitelisted: [Role.OrganisationAdmin],
    },
  ]

  const participantRoutes: Route[] = [
    {
      method: HttpMethod.GET,
      url: '/studies/1/participants',
      rolesWhitelisted: [Role.OrganisationAdmin],
    },
    {
      method: HttpMethod.GET,
      url: '/studies/1/participants/1',
      rolesWhitelisted: [Role.OrganisationAdmin],
    },
  ]

  const familyRoutes: Route[] = [
    {
      method: HttpMethod.GET,
      url: '/studies/1/families/1',
      rolesWhitelisted: [Role.OrganisationAdmin],
    },
    {
      method: HttpMethod.POST,
      url: '/studies/1/families/remove/1',
      rolesWhitelisted: [Role.OrganisationAdmin],
    },
    {
      method: HttpMethod.POST,
      url: '/studies/1/families/1/add/1',
      rolesWhitelisted: [Role.OrganisationAdmin],
    },
    {
      method: HttpMethod.POST,
      url: '/studies/1/families/1/add-dependent',
      rolesWhitelisted: [Role.OrganisationAdmin],
    },
  ]

  const inviteRoutes: Route[] = [
    {
      method: HttpMethod.GET,
      url: '/invites/pending',
      rolesWhitelisted: [Role.Participant],
    },
    {
      method: HttpMethod.POST,
      url: '/invites/1/accept',
      rolesWhitelisted: [Role.Participant],
    },
    {
      method: HttpMethod.GET,
      url: '/studies/1/invites',
      rolesWhitelisted: [Role.OrganisationAdmin],
    },
    {
      method: HttpMethod.POST,
      url: '/studies/1/invites',
      rolesWhitelisted: [Role.OrganisationAdmin],
    },
    {
      method: HttpMethod.POST,
      url: '/studies/1/invites/inviteId/resend',
      rolesWhitelisted: [Role.OrganisationAdmin],
    },
    {
      method: HttpMethod.POST,
      url: '/studies/1/invites/resend',
      rolesWhitelisted: [Role.OrganisationAdmin],
    },
    {
      method: HttpMethod.POST,
      url: '/studies/1/invites/inviteId/revoke',
      rolesWhitelisted: [Role.OrganisationAdmin],
    },
    {
      method: HttpMethod.GET,
      url: '/studies/1/invites/text',
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

  describe('Study Routes', () => {
    studyRoutes.forEach((route: Route) => {
      it(`${route.method.toUpperCase()} ${route.url} should be a protected route`, async () => {
        await checkProtectedRoutes(route)
      })
    })
  })

  describe('Settings Routes', () => {
    settingsRoutes.forEach((route: Route) => {
      it(`${route.method.toUpperCase()} ${route.url} should be a protected route`, async () => {
        await checkProtectedRoutes(route)
      })
    })
  })

  describe('Auth Routes', () => {
    authRoutes.forEach((route: Route) => {
      it(`${route.method.toUpperCase()} ${route.url} should be a protected route`, async () => {
        await checkProtectedRoutes(route)
      })
    })
  })

  describe('Family Routes', () => {
    familyRoutes.forEach((route: Route) => {
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

  describe('Mailer Routes', () => {
    mailerRoutes.forEach((route: Route) => {
      it(`${route.method.toUpperCase()} ${route.url} should be a protected route`, async () => {
        await checkProtectedRoutes(route)
      })
    })
  })

  describe('Integration Routes', () => {
    integrationRoutes.forEach((route: Route) => {
      it(`${route.method.toUpperCase()} ${route.url} should be a protected route`, async () => {
        await checkProtectedRoutes(route)
      })
    })
  })

  describe('Participant Routes', () => {
    participantRoutes.forEach((route: Route) => {
      it(`${route.method.toUpperCase()} ${route.url} should be a protected route`, async () => {
        await checkProtectedRoutes(route)
      })
    })
  })

  describe('Invite Routes', () => {
    inviteRoutes.forEach((route: Route) => {
      it(`${route.method.toUpperCase()} ${route.url} should be a protected route`, async () => {
        await checkProtectedRoutes(route)
      })
    })
  })
})
