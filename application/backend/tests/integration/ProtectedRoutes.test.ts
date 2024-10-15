import request from 'supertest'
import { Api } from '../../src/Api'
import type {
  CreateUserResponse,
  DeleteUserResponse,
  GetAllUsersResponse,
  GetUserByIdResponse,
  UpdateUserResponse,
} from 'common/types/api/users'
import type {
  AddUserToOrganisationResponse,
  CreateOrganisationResponse,
  DeleteOrganisationResponse,
  GetAllOrganisationsResponse,
  GetOrganisationByIdResponse,
  GetOrganisationUsersResponse,
  RemoveUserFromOrganisationResponse,
  UpdateOrganisationResponse,
} from 'common/types/api/organisations'

const api = new Api()
const app = api.app

describe('Api', () => {
  beforeAll(async () => {
    api.run()
  })

  afterAll(async () => {
    api.stop()
  })

  describe('UsersController', () => {
    describe('GET /users', () => {
      it('should be a protected route', async () => {
        const response = await request(app).get('/users')
        expect(response.status).toBe(401)

        const body: GetAllUsersResponse = response.body
        expect(body.message).toBe('No token provided')
      })
    })

    describe('GET /users/{userID}', () => {
      it('should be a protected route', async () => {
        const response = await request(app).get('/users/1')
        expect(response.status).toBe(401)

        const body: GetUserByIdResponse = response.body
        expect(body.message).toBe('No token provided')
      })
    })

    describe('POST /users', () => {
      it('should be a protected route', async () => {
        const response = await request(app).post('/users')
        expect(response.status).toBe(401)

        const body: CreateUserResponse = response.body
        expect(body.message).toBe('No token provided')
      })
    })

    describe('PATCH /users/{userID}', () => {
      it('should be a protected route', async () => {
        const response = await request(app).patch('/users/1')
        expect(response.status).toBe(401)

        const body: UpdateUserResponse = response.body
        expect(body.message).toBe('No token provided')
      })
    })

    describe('DELETE /users/{userID}', () => {
      it('should be a protected route', async () => {
        const response = await request(app).delete('/users/1')
        expect(response.status).toBe(401)

        const body: DeleteUserResponse = response.body
        expect(body.message).toBe('No token provided')
      })
    })
  })

  describe('OrganisationsController', () => {
    describe('GET /organisations', () => {
      it('should be a protected route', async () => {
        const response = await request(app).get('/organisations')
        expect(response.status).toBe(401)

        const body: GetAllOrganisationsResponse = response.body
        expect(body.message).toBe('No token provided')
      })
    })

    describe('GET /organisations/{orgID}', () => {
      it('should be a protected route', async () => {
        const response = await request(app).get('/organisations/1')
        expect(response.status).toBe(401)

        const body: GetOrganisationByIdResponse = response.body
        expect(body.message).toBe('No token provided')
      })
    })

    describe('POST /organisations', () => {
      it('should be a protected route', async () => {
        const response = await request(app).post('/organisations')
        expect(response.status).toBe(401)

        const body: CreateOrganisationResponse = response.body
        expect(body.message).toBe('No token provided')
      })
    })

    describe('PATCH /organisations/{orgID}', () => {
      it('should be a protected route', async () => {
        const response = await request(app).patch('/organisations/1')
        expect(response.status).toBe(401)

        const body: UpdateOrganisationResponse = response.body
        expect(body.message).toBe('No token provided')
      })
    })

    describe('DELETE /organisations/{orgID}', () => {
      it('should be a protected route', async () => {
        const response = await request(app).delete('/organisations/1')
        expect(response.status).toBe(401)

        const body: DeleteOrganisationResponse = response.body
        expect(body.message).toBe('No token provided')
      })
    })

    describe('GET /organisations/{orgID}/users', () => {
      it('should be a protected route', async () => {
        const response = await request(app).get(`/organisations/1/users`)
        expect(response.status).toBe(401)

        const body: GetOrganisationUsersResponse = response.body
        expect(body.message).toBe('No token provided')
      })
    })

    describe('POST /organisations/{orgID}/users/{userID}', () => {
      it('should be a protected route', async () => {
        const response = await request(app).post(`/organisations/1/users/2`)
        expect(response.status).toBe(401)

        const body: AddUserToOrganisationResponse = response.body
        expect(body.message).toBe('No token provided')
      })
    })

    describe('DELETE /organisations/{orgID}/users/{userID}', () => {
      it('should be a protected route', async () => {
        const response = await request(app).delete(`/organisations/1/users/2`)
        expect(response.status).toBe(401)

        const body: RemoveUserFromOrganisationResponse = response.body
        expect(body.message).toBe('No token provided')
      })
    })
  })
})
