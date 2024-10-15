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
import { resetDB } from '../../tests/integration/TestHelpers'
import { getUserIdFromToken } from '../authentication'
import { RegisterRequest, RegisterResponse } from 'common/types/api/auth'

const api = new Api()
const app = api.app

describe('OrganisationsController', () => {
  let token: string
  let token2: string
  let testOrganisationID: number
  let testUserID: number
  let testUserInOrgID: number

  const testUser: RegisterRequest = {
    firstName: 'Test',
    lastName: 'User',
    email: 'test@user.com',
    password: 'password123',
    role: 'test',
  }

  const testUserInOrg: RegisterRequest = {
    firstName: 'Test',
    lastName: 'UserInOrg',
    email: 'test@org.com',
    password: 'password123',
    role: 'test',
  }

  beforeAll(async () => {
    api.run()
  })

  beforeEach(async () => {
    await resetDB()

    // Register user
    const registerResponse1 = await request(app).post('/auth/register').send(testUser)
    const body1: RegisterResponse = registerResponse1.body
    if (!body1.token) throw new Error()
    token = body1.token
    testUserID = getUserIdFromToken(token)

    // Register user
    const registerResponse2 = await request(app).post('/auth/register').send(testUserInOrg)
    const body2: RegisterResponse = registerResponse2.body
    if (!body2.token) throw new Error()
    token2 = body2.token
    testUserInOrgID = getUserIdFromToken(token2)

    // Create organisation
    const createOrganisationResponse = await request(app)
      .post('/organisations')
      .set({ Authorization: `Bearer ${token}` })
      .send({ name: 'Test Organisation' } as CreateOrganisationRequest)
    const createOrganisationBody: CreateOrganisationResponse = createOrganisationResponse.body
    if (!createOrganisationBody.newOrganisation)
      throw new Error('Organisation could not be created')
    testOrganisationID = createOrganisationBody.newOrganisation.id

    // Add user to organisation
    const addUserToOrganisationResponse = await request(app)
      .post(`/organisations/${testOrganisationID}/users/${testUserInOrgID}`)
      .set({ Authorization: `Bearer ${token2}` })

    if (addUserToOrganisationResponse.status !== 200)
      throw new Error('User could not be added to organisation')
  })

  afterAll(async () => {
    api.stop()
  })

  describe('GET /organisations', () => {
    it('should return a list of organisations', async () => {
      const response = await request(app)
        .get('/organisations')
        .set({ Authorization: `Bearer ${token}` })
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
        .set({ Authorization: `Bearer ${token}` })
      expect(response.status).toBe(500)
    })
  })

  describe('GET /organisations/:OrgID', () => {
    it('should return an organisation by ID', async () => {
      const response = await request(app)
        .get(`/organisations/${testOrganisationID}`)
        .set({ Authorization: `Bearer ${token}` })
      expect(response.status).toBe(200)

      const body: GetOrganisationByIdResponse = response.body
      expect(body.organisation).not.toBeNull()
      expect(body.organisation?.id).toBe(testOrganisationID)
    })

    it('should return a 404 error if the organisation does not exist', async () => {
      const notExistingOrganisationId: number = 1234567890
      const response = await request(app)
        .get(`/organisations/${notExistingOrganisationId}`)
        .set({ Authorization: `Bearer ${token}` })

      expect(response.status).toBe(404)

      const body: GetOrganisationByIdResponse = response.body
      expect(body.message).toBe(`Organisation with ID: ${notExistingOrganisationId} not found`)
      expect(body.organisation).toBe(null)
    })

    it('should return a 500 error if a database error occurs', async () => {
      jest.spyOn(prisma.organisation, 'findUnique').mockImplementationOnce(() => {
        throw new Error('Internal Server Error')
      })
      const response = await request(app)
        .get(`/organisations/${testOrganisationID}`)
        .set({ Authorization: `Bearer ${token}` })
      expect(response.status).toBe(500)
    })
  })

  describe('POST /organisations', () => {
    it('should create a new organisation', async () => {
      const newOrganisationName = 'New Test Organisation'

      // Check organisation doesn't exist
      const existingOrg = await prisma.organisation.findFirst({
        where: { name: newOrganisationName },
      })
      if (existingOrg) {
        throw new Error('Organisation with that name already exists')
      }

      const response = await request(app)
        .post('/organisations')
        .set({ Authorization: `Bearer ${token}` })
        .send({ name: newOrganisationName } as CreateOrganisationRequest)
      expect(response.status).toBe(201)

      const body: CreateOrganisationResponse = response.body
      expect(body.newOrganisation).not.toBeNull()
      expect(body.newOrganisation?.name).toBe(newOrganisationName)

      // Check organisation now exists in db
      const createdOrg = await prisma.organisation.findFirst({
        where: { name: newOrganisationName },
      })
      expect(createdOrg).not.toBeNull()
    })

    it('should return a 500 error if a database error occurs', async () => {
      jest.spyOn(prisma.organisation, 'create').mockImplementationOnce(() => {
        throw new Error('Internal Server Error')
      })

      const response = await request(app)
        .post('/organisations')
        .set({ Authorization: `Bearer ${token}` })
        .send({ name: 'New Testing Organisation' } as CreateOrganisationRequest)

      expect(response.status).toBe(500)

      const body: CreateOrganisationResponse = response.body
      expect(body.message).toBe('Internal Server Error')
      expect(body.newOrganisation).toBe(undefined)
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
        .patch(`/organisations/${testOrganisationID}`)
        .set({ Authorization: `Bearer ${token}` })
        .send({ name: updatedOrganisationName } as UpdateOrganisationRequest)
      expect(response.status).toBe(200)

      const body: UpdateOrganisationResponse = response.body
      expect(body.updatedOrganisation).not.toBeNull()
      expect(body.updatedOrganisation?.name).toBe(updatedOrganisationName)

      // Check updated organisation in db
      const updatedOrg = await prisma.organisation.findFirst({
        where: { id: testOrganisationID },
      })
      expect(updatedOrg).not.toBeNull()
      expect(updatedOrg?.name).toBe(updatedOrganisationName)
    })

    it('should return a 404 error if the organisation is not found', async () => {
      const notExistingOrganisationId: number = 1234567890
      const response = await request(app)
        .patch(`/organisations/${notExistingOrganisationId}`)
        .set({ Authorization: `Bearer ${token}` })
        .send({ name: 'Updated Test Organisation' } as UpdateOrganisationRequest)

      expect(response.status).toBe(404)

      const body: UpdateOrganisationResponse = response.body
      expect(body.message).toBe(`Organisation with ID: ${notExistingOrganisationId} not found`)
      expect(body.updatedOrganisation).toBe(null)
    })

    it('should return a 500 error if a database error occurs', async () => {
      jest.spyOn(prisma.organisation, 'update').mockImplementationOnce(() => {
        throw new Error('Internal Server Error')
      })

      const response = await request(app)
        .patch(`/organisations/${testOrganisationID}`)
        .set({ Authorization: `Bearer ${token}` })
        .send({ name: 'Updated Test Organisation' } as UpdateOrganisationRequest)

      expect(response.status).toBe(500)

      const body: UpdateOrganisationResponse = response.body
      expect(body.message).toBe('Error updating organisation')
    })
  })

  describe('DELETE /organisations/:OrgID', () => {
    it('should delete an existing organisation', async () => {
      const response = await request(app)
        .delete(`/organisations/${testOrganisationID}`)
        .set({ Authorization: `Bearer ${token}` })
      expect(response.status).toBe(200)

      const body: DeleteOrganisationResponse = response.body
      expect(body.deletedOrganisation).not.toBeNull()
      expect(body.deletedOrganisation?.id).toBe(testOrganisationID)

      // Check deleted organisation in db
      const deletedOrg = await prisma.organisation.findFirst({
        where: { id: testOrganisationID },
      })
      expect(deletedOrg).toBeNull()
    })

    it('should return a 404 error if the organisation is not found', async () => {
      const notExistingOrganisationId: number = 1234567890
      const response = await request(app)
        .delete(`/organisations/${notExistingOrganisationId}`)
        .set({ Authorization: `Bearer ${token}` })

      expect(response.status).toBe(404)

      const body: DeleteOrganisationResponse = response.body
      expect(body.message).toBe(`Organisation with ID: ${notExistingOrganisationId} not found`)
      expect(body.deletedOrganisation).toBe(null)
    })

    it('should return a 500 error if a database error occurs', async () => {
      jest.spyOn(prisma.organisation, 'delete').mockImplementationOnce(() => {
        throw new Error('Internal Server Error')
      })

      const response = await request(app)
        .delete(`/organisations/${testOrganisationID}`)
        .set({ Authorization: `Bearer ${token}` })

      expect(response.status).toBe(500)

      const body: DeleteOrganisationResponse = response.body
      expect(body.message).toBe('Error deleting organisation')
    })
  })

  describe('GET /organisations/:OrgID/users', () => {
    it('should return a list of users for an organisation', async () => {
      const response = await request(app)
        .get(`/organisations/${testOrganisationID}/users`)
        .set({ Authorization: `Bearer ${token}` })
      expect(response.status).toBe(200)

      const body: GetOrganisationUsersResponse = response.body
      expect(body.users?.length).toBe(1)
      expect(body.users?.[0].id).toBe(testUserInOrgID)
    })

    it('should return a 404 error if the organisation is not found', async () => {
      const notExistingOrganisationId: number = 1234567890
      const response = await request(app)
        .get(`/organisations/${notExistingOrganisationId}/users`)
        .set({ Authorization: `Bearer ${token}` })

      expect(response.status).toBe(404)
      const body: GetOrganisationUsersResponse = response.body
      expect(body.message).toBe(`Organisation with ID: ${notExistingOrganisationId} not found`)
      expect(body.users).toBe(null)
    })
  })

  describe('POST /organisations/:OrgID/users/:UserID', () => {
    it('should add a user to an organisation', async () => {
      const response = await request(app)
        .post(`/organisations/${testOrganisationID}/users/${testUserID}`)
        .set({ Authorization: `Bearer ${token}` })
      expect(response.status).toBe(200)

      const body: AddUserToOrganisationResponse = response.body
      expect(body.message).toBe(
        `User with ID: ${testUserID} added to organisation with ID: ${testOrganisationID}`,
      )
    })

    it('should return a 404 error if the user is not found', async () => {
      const notExistingUserId: number = 1234567890
      const response = await request(app)
        .post(`/organisations/${testOrganisationID}/users/${notExistingUserId}`)
        .set({ Authorization: `Bearer ${token}` })

      expect(response.status).toBe(404)

      const body: AddUserToOrganisationResponse = response.body
      expect(body.message).toBe(`User with ID: ${notExistingUserId} not found`)
    })

    it('should return a 404 error if the organisation is not found', async () => {
      const notExistingOrganisationId: number = 1234567890
      const response = await request(app)
        .post(`/organisations/${notExistingOrganisationId}/users/${testUserID}`)
        .set({ Authorization: `Bearer ${token}` })

      expect(response.status).toBe(404)

      const body: RemoveUserFromOrganisationResponse = response.body
      expect(body.message).toBe(`Organisation with ID: ${notExistingOrganisationId} not found`)
    })
  })

  describe('DELETE /organisations/:OrgID/users/:UserID', () => {
    it('should remove a user from an organisation', async () => {
      const response = await request(app)
        .delete(`/organisations/${testOrganisationID}/users/${testUserInOrgID}`)
        .set({ Authorization: `Bearer ${token}` })
      expect(response.status).toBe(200)

      const body: RemoveUserFromOrganisationResponse = response.body
      expect(body.message).toBe(
        `User with ID: ${testUserInOrgID} removed from organisation with ID: ${testOrganisationID}`,
      )
    })

    it('should return a 404 error if the user is not found', async () => {
      const notExistingUserId: number = 1234567890
      const response = await request(app)
        .delete(`/organisations/${testOrganisationID}/users/${notExistingUserId}`)
        .set({ Authorization: `Bearer ${token}` })

      expect(response.status).toBe(404)

      const body: RemoveUserFromOrganisationResponse = response.body
      expect(body.message).toBe(`User with ID: ${notExistingUserId} not found`)
    })

    it('should return a 404 error if the organisation is not found', async () => {
      const notExistingOrganisationId: number = 1234567890
      const response = await request(app)
        .delete(`/organisations/${notExistingOrganisationId}/users/${testUserID}`)
        .set({ Authorization: `Bearer ${token}` })

      expect(response.status).toBe(404)

      const body: RemoveUserFromOrganisationResponse = response.body
      expect(body.message).toBe(`Organisation with ID: ${notExistingOrganisationId} not found`)
    })
  })
})
