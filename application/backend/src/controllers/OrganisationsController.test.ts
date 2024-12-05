import request from 'supertest'
import { Api } from '../Api'
import prisma from '../PrismaClient'
import {
  GetAllOrganisationsResponse,
  GetOrganisationByIdResponse,
  CreateOrganisationRequest,
  CreateOrganisationResponse,
  UpdateOrganisationRequest,
  UpdateOrganisationResponse,
  DeleteOrganisationResponse,
  AddUserToOrganisationResponse,
  RemoveUserFromOrganisationResponse,
  GetOrganisationUsersResponse,
} from 'common/types/api/organisations'
import { resetDB } from '../../tests/TestHelpers'
import { generateToken, getUserIdFromToken } from '../authentication'

const api = new Api()
const app = api.app

describe('OrganisationsController', () => {
  let orgAdmintoken: string
  let tokenInOrganisation: string

  const testOrganisationId: number = 99
  let orgAdminTestUserId: number
  let testUserInOrgId: number

  beforeAll(async () => {
    api.run()
  })

  beforeEach(async () => {
    await resetDB()

    orgAdmintoken = await generateToken({ userId: 99, roles: ['OrganisationAdmin'] })
    tokenInOrganisation = await generateToken({ userId: 97, roles: ['OrganisationAdmin'] })

    orgAdminTestUserId = await getUserIdFromToken(orgAdmintoken)
    testUserInOrgId = await getUserIdFromToken(tokenInOrganisation)
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
      expect(Array.isArray(body.organisations)).toBeTruthy()
      expect(body.organisations.length).toBeGreaterThan(0)
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
      expect(body.organisation).not.toBeNull()
      expect(body.organisation?.id).toBe(testOrganisationId)
    })

    it('should return a 404 error if the organisation does not exist', async () => {
      const notExistingOrganisationId: number = 1234567890
      const response = await request(app)
        .get(`/organisations/${notExistingOrganisationId}`)
        .set({ Authorization: `Bearer ${orgAdmintoken}` })

      expect(response.status).toBe(404)

      const body: GetOrganisationByIdResponse = response.body
      expect(body.message).toBe(`Organisation with ID: ${notExistingOrganisationId} not found`)
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

      const body: CreateOrganisationResponse = response.body
      expect(body.message).toBe('Internal Server Error')
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
      expect(response.status).toBe(200)

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

      const body: UpdateOrganisationResponse = response.body
      expect(body.message).toBe(`Organisation with ID: ${notExistingOrganisationId} not found`)
    })
  })

  describe('DELETE /organisations/:OrgID', () => {
    it('should delete an existing organisation', async () => {
      const response = await request(app)
        .delete(`/organisations/${testOrganisationId}`)
        .set({ Authorization: `Bearer ${orgAdmintoken}` })
      expect(response.status).toBe(200)

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

      const body: DeleteOrganisationResponse = response.body
      expect(body.message).toBe(`Organisation with ID: ${notExistingOrganisationId} not found`)
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
      expect(body.users?.length).toBe(1)
      expect(body.users?.[0].id).toBe(testUserInOrgId)
    })

    it('should return a 404 error if the organisation is not found', async () => {
      const notExistingOrganisationId: number = 1234567890
      const response = await request(app)
        .get(`/organisations/${notExistingOrganisationId}/users`)
        .set({ Authorization: `Bearer ${orgAdmintoken}` })

      expect(response.status).toBe(404)
      const body: GetOrganisationUsersResponse = response.body
      expect(body.message).toBe(`Organisation with ID: ${notExistingOrganisationId} not found`)
    })
  })

  describe('POST /organisations/:OrgID/users/:UserID', () => {
    it('should add a user to an organisation', async () => {
      const response = await request(app)
        .post(`/organisations/${testOrganisationId}/users/${orgAdminTestUserId}`)
        .set({ Authorization: `Bearer ${orgAdmintoken}` })
      expect(response.status).toBe(200)

      const body: AddUserToOrganisationResponse = response.body
      expect(body.message).toBe(
        `User with ID: ${orgAdminTestUserId} added to organisation with ID: ${testOrganisationId}`,
      )
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
        .post(`/organisations/${notExistingOrganisationId}/users/${orgAdminTestUserId}`)
        .set({ Authorization: `Bearer ${orgAdmintoken}` })

      expect(response.status).toBe(404)

      const body: RemoveUserFromOrganisationResponse = response.body
      expect(body.message).toBe(`Organisation with ID: ${notExistingOrganisationId} not found`)
    })
  })

  describe('DELETE /organisations/:OrgID/users/:UserID', () => {
    it('should remove a user from an organisation', async () => {
      const response = await request(app)
        .delete(`/organisations/${testOrganisationId}/users/${testUserInOrgId}`)
        .set({ Authorization: `Bearer ${orgAdmintoken}` })

      expect(response.status).toBe(200)

      const body: RemoveUserFromOrganisationResponse = response.body
      expect(body.message).toBe(
        `User with ID: ${testUserInOrgId} removed from organisation with ID: ${testOrganisationId}`,
      )
    })

    it('should return a 404 error if the user is not found', async () => {
      const notExistingUserId: number = 1234567890
      const response = await request(app)
        .delete(`/organisations/${testOrganisationId}/users/${notExistingUserId}`)
        .set({ Authorization: `Bearer ${orgAdmintoken}` })

      expect(response.status).toBe(404)

      const body: RemoveUserFromOrganisationResponse = response.body
      expect(body.message).toBe(`User with ID: ${notExistingUserId} not found`)
    })

    it('should return a 404 error if the organisation is not found', async () => {
      const notExistingOrganisationId: number = 1234567890
      const response = await request(app)
        .delete(`/organisations/${notExistingOrganisationId}/users/${orgAdminTestUserId}`)
        .set({ Authorization: `Bearer ${orgAdmintoken}` })

      expect(response.status).toBe(404)

      const body: RemoveUserFromOrganisationResponse = response.body
      expect(body.message).toBe(`Organisation with ID: ${notExistingOrganisationId} not found`)
    })
  })
})
