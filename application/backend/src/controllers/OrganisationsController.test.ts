import request from 'supertest'
import { Api } from '../Api'
import prisma from '../PrismaClient'
import {
  GetAllOrganisationsResponse,
  GetOrganisationByIdResponse,
  CreateOrganisationRequest,
  UpdateOrganisationRequest,
  AddUserToOrganisationResponse,
  GetOrganisationUsersResponse,
} from 'common/types/api/organisations'
import { resetDB } from '../../tests/TestHelpers'
import { generateToken } from '../authentication'
import { ORG_ADMIN_ID, PARTICIPANT_COMPLETED_ID } from '../../tests/seed'

const api = new Api()
const app = api.app

describe('OrganisationsController', () => {
  let orgAdmintoken: string

  const testOrganisationId: number = 99

  beforeAll(async () => {
    api.run()
  })

  beforeEach(async () => {
    await resetDB()

    orgAdmintoken = await generateToken({ userId: ORG_ADMIN_ID, roles: ['OrganisationAdmin'] })
  })

  afterAll(async () => {
    api.stop()
  })

  describe('GET /organisations', () => {
    it('should return a list of organisations', async () => {
      const response = await request(app)
        .get('/organisations')
        .set({ Authorization: `Bearer ${orgAdmintoken}` })
      expect(response.status).toBe(200)

      const body: GetAllOrganisationsResponse = response.body
      expect(Array.isArray(body.data)).toBeTruthy()
      expect(body.data.length).toBeGreaterThan(0)
    })

    it('should return a 500 error if a database error occurs', async () => {
      jest.spyOn(prisma.organisation, 'findMany').mockImplementationOnce(() => {
        throw new Error('Internal Server Error')
      })
      const response = await request(app)
        .get('/organisations')
        .set({ Authorization: `Bearer ${orgAdmintoken}` })
      expect(response.status).toBe(500)
    })
  })

  describe('GET /organisations/:OrgID', () => {
    it('should return an organisation by ID', async () => {
      const response = await request(app)
        .get(`/organisations/${testOrganisationId}`)
        .set({ Authorization: `Bearer ${orgAdmintoken}` })
      expect(response.status).toBe(200)

      const body: GetOrganisationByIdResponse = response.body
      expect(body.data).not.toBeNull()
      expect(body.data.id).toBe(testOrganisationId)
    })

    it('should return a 404 error if the organisation does not exist', async () => {
      const notExistingOrganisationId: number = 1234567890
      const response = await request(app)
        .get(`/organisations/${notExistingOrganisationId}`)
        .set({ Authorization: `Bearer ${orgAdmintoken}` })

      expect(response.status).toBe(404)

      expect(response.body.message).toBe(
        `Organisation with ID: ${notExistingOrganisationId} not found`,
      )
    })

    it('should return a 500 error if a database error occurs', async () => {
      jest.spyOn(prisma.organisation, 'findUnique').mockImplementationOnce(() => {
        throw new Error('Internal Server Error')
      })
      const response = await request(app)
        .get(`/organisations/${testOrganisationId}`)
        .set({ Authorization: `Bearer ${orgAdmintoken}` })
      expect(response.status).toBe(500)
    })
  })

  describe('POST /organisations', () => {
    it('should create a new organisation', async () => {
      const newOrganisationName = 'New Test Organisation'

      const response = await request(app)
        .post('/organisations')
        .set({ Authorization: `Bearer ${orgAdmintoken}` })
        .send({ name: newOrganisationName } as CreateOrganisationRequest)
      expect(response.status).toBe(201)

      // Check organisation now exists in db
      const createdOrg = await prisma.organisation.findFirst({
        where: { name: newOrganisationName },
      })
      expect(createdOrg?.name).toBe(newOrganisationName)
    })

    it('should return an error if the organisation already exists', async () => {
      const organisationNameAlreadyExists = 'Test Organisation'
      const response = await request(app)
        .post('/organisations')
        .set({ Authorization: `Bearer ${orgAdmintoken}` })
        .send({ name: organisationNameAlreadyExists } as CreateOrganisationRequest)
      expect(response.status).toBe(500)
    })

    it('should return a 500 error if a database error occurs', async () => {
      jest.spyOn(prisma.organisation, 'create').mockImplementationOnce(() => {
        throw new Error('Internal Server Error')
      })

      const response = await request(app)
        .post('/organisations')
        .set({ Authorization: `Bearer ${orgAdmintoken}` })
        .send({ name: 'New Testing Organisation' } as CreateOrganisationRequest)

      expect(response.status).toBe(500)

      expect(response.body.message).toBe('Internal Server Error')
    })
  })

  describe('PATCH /organisations/:OrgID', () => {
    it('should update an existing organisation', async () => {
      const organisaitonName: string = 'Test Organisation'
      // Check test organisation exists
      const existingOrg = await prisma.organisation.findFirst({
        where: { name: organisaitonName },
      })

      expect(existingOrg?.name).toBe(organisaitonName)

      const updatedOrganisationName = 'Updated Test Organisation'

      const response = await request(app)
        .patch(`/organisations/${testOrganisationId}`)
        .set({ Authorization: `Bearer ${orgAdmintoken}` })
        .send({ name: updatedOrganisationName } as UpdateOrganisationRequest)
      expect(response.status).toBe(204)

      // Check updated organisation in db
      const updatedOrg = await prisma.organisation.findFirst({
        where: { id: testOrganisationId },
      })
      expect(updatedOrg).not.toBeNull()
      expect(updatedOrg?.name).toBe(updatedOrganisationName)
    })

    it('should return a 404 error if the organisation is not found', async () => {
      const notExistingOrganisationId: number = 1234567890
      const response = await request(app)
        .patch(`/organisations/${notExistingOrganisationId}`)
        .set({ Authorization: `Bearer ${orgAdmintoken}` })
        .send({ name: 'Updated Test Organisation' } as UpdateOrganisationRequest)

      expect(response.status).toBe(404)

      expect(response.body.message).toBe(
        `Organisation with ID: ${notExistingOrganisationId} not found`,
      )
    })
  })

  describe('DELETE /organisations/:OrgID', () => {
    it('should delete an existing organisation', async () => {
      const response = await request(app)
        .delete(`/organisations/${testOrganisationId}`)
        .set({ Authorization: `Bearer ${orgAdmintoken}` })
      expect(response.status).toBe(204)

      // Check deleted organisation in db
      const deletedOrg = await prisma.organisation.findFirst({
        where: { id: testOrganisationId },
      })
      expect(deletedOrg).toBeNull()
    })

    it('should return a 404 error if the organisation is not found', async () => {
      const notExistingOrganisationId: number = 1234567890
      const response = await request(app)
        .delete(`/organisations/${notExistingOrganisationId}`)
        .set({ Authorization: `Bearer ${orgAdmintoken}` })

      expect(response.status).toBe(404)

      expect(response.body.message).toBe(
        `Organisation with ID: ${notExistingOrganisationId} not found`,
      )
    })
  })

  describe('GET /organisations/:OrgID/users', () => {
    it('should return a list of users for an organisation', async () => {
      const response = await request(app)
        .get('/organisations/99/users')
        .set({ Authorization: `Bearer ${orgAdmintoken}` })
      expect(response.status).toBe(200)

      const body: GetOrganisationUsersResponse = response.body
      console.log(body)
      expect(body.data.length).toBe(2)
      expect(body.data[0].id).toBe(ORG_ADMIN_ID)
    })

    it('should return a 404 error if the organisation is not found', async () => {
      const notExistingOrganisationId: number = 1234567890
      const response = await request(app)
        .get(`/organisations/${notExistingOrganisationId}/users`)
        .set({ Authorization: `Bearer ${orgAdmintoken}` })

      expect(response.status).toBe(404)
      expect(response.body.message).toBe(
        `Organisation with ID: ${notExistingOrganisationId} not found`,
      )
    })
  })

  describe('POST /organisations/:OrgID/users/:UserID', () => {
    it('should add a user to an organisation', async () => {
      const response = await request(app)
        .post(`/organisations/${testOrganisationId}/users/${PARTICIPANT_COMPLETED_ID}`)
        .set({ Authorization: `Bearer ${orgAdmintoken}` })
      expect(response.status).toBe(204)
    })

    it('should return a 404 error if the user is not found', async () => {
      const notExistingUserId: number = 1234567890
      const response = await request(app)
        .post(`/organisations/${testOrganisationId}/users/${notExistingUserId}`)
        .set({ Authorization: `Bearer ${orgAdmintoken}` })

      expect(response.status).toBe(404)

      const body: AddUserToOrganisationResponse = response.body
      expect(body.message).toBe(`User with ID: ${notExistingUserId} not found`)
    })

    it('should return a 404 error if the organisation is not found', async () => {
      const notExistingOrganisationId: number = 1234567890
      const response = await request(app)
        .post(`/organisations/${notExistingOrganisationId}/users/${ORG_ADMIN_ID}`)
        .set({ Authorization: `Bearer ${orgAdmintoken}` })

      expect(response.status).toBe(404)

      expect(response.body.message).toBe(
        `Organisation with ID: ${notExistingOrganisationId} not found`,
      )
    })
  })

  describe('DELETE /organisations/:OrgID/users/:UserID', () => {
    it('should remove a user from an organisation', async () => {
      const response = await request(app)
        .delete(`/organisations/${testOrganisationId}/users/${ORG_ADMIN_ID}`)
        .set({ Authorization: `Bearer ${orgAdmintoken}` })

      expect(response.status).toBe(204)
    })

    it('should return a 404 error if the user is not found', async () => {
      const notExistingUserId: number = 1234567890
      const response = await request(app)
        .delete(`/organisations/${testOrganisationId}/users/${notExistingUserId}`)
        .set({ Authorization: `Bearer ${orgAdmintoken}` })

      expect(response.status).toBe(404)

      expect(response.body.message).toBe(`User with ID: ${notExistingUserId} not found`)
    })

    it('should return a 404 error if the organisation is not found', async () => {
      const notExistingOrganisationId: number = 1234567890
      const response = await request(app)
        .delete(`/organisations/${notExistingOrganisationId}/users/${ORG_ADMIN_ID}`)
        .set({ Authorization: `Bearer ${orgAdmintoken}` })

      expect(response.status).toBe(404)

      expect(response.body.message).toBe(
        `Organisation with ID: ${notExistingOrganisationId} not found`,
      )
    })
  })
})
