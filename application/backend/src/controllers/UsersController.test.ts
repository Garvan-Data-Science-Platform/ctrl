import request from 'supertest'
import { Api } from '../Api'
import prisma from '../PrismaClient'
import { resetDB } from 'common/testing/TestHelpers'
import { generateToken } from '../authentication'
import type { RegisterRequest } from 'common/types/api/auth'
import {
  GetAllUsersResponse,
  GetUserByIdResponse,
  UpdateUserRoleRequest,
} from 'common/types/api/users'
import { Role } from '@prisma/client'
import { OPERATOR_ADMIN_ID, ORG_ADMIN_ID, PARTICIPANT_UNANSWERED_ID } from 'common/testing/seed'

const api = new Api()
const app = api.app

describe('UsersController', () => {
  let token: string
  let opAdminToken: string
  let orgAdminToken: string

  beforeAll(async () => {
    opAdminToken = await generateToken({ userId: OPERATOR_ADMIN_ID, roles: ['OperatorAdmin'] })
    orgAdminToken = await generateToken({ userId: ORG_ADMIN_ID, roles: ['OrganisationAdmin'] })

    token = await generateToken({
      userId: PARTICIPANT_UNANSWERED_ID,
      roles: ['Participant'],
    })

    api.run()
  })

  beforeEach(async () => {
    await resetDB()
  })

  afterAll(async () => {
    api.stop()
  })

  describe('GET /users', () => {
    it('should return a list of users', async () => {
      const response = await request(app)
        .get('/users')
        .set({ Authorization: `Bearer ${orgAdminToken}` })
      expect(response.status).toBe(200)

      const body: GetAllUsersResponse = response.body
      expect(body).toHaveProperty('data')
    })

    it('should return a 500 error if a database error occurs', async () => {
      jest.spyOn(prisma.user, 'findMany').mockImplementationOnce(() => {
        throw new Error('Internal Server Error')
      })
      const response = await request(app)
        .get('/users')
        .set({ Authorization: `Bearer ${orgAdminToken}` })

      expect(response.status).toBe(500)

      const body: GetAllUsersResponse = response.body
      expect(body.data).toBe(undefined)
    })
  })

  describe('GET /users/:id', () => {
    it('should return a user by ID', async () => {
      const userId = PARTICIPANT_UNANSWERED_ID
      const response = await request(app)
        .get(`/users/${userId}`)
        .set({ Authorization: `Bearer ${token}` })

      expect(response.status).toBe(200)

      const body: GetUserByIdResponse = response.body
      expect(body).toHaveProperty('data')
    })

    it('should return an error for a non-existent user', async () => {
      const userId = 9999
      const response = await request(app)
        .get(`/users/${userId}`)
        .set({
          Authorization: `Bearer ${token}`,
        })

      expect(response.status).toBe(404)

      expect(response.body.message).toBe(`User with ID: ${userId} not found`)
    })
  })

  describe('POST /users', () => {
    it('should create a new user', async () => {
      const newUser = {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        password: 'password123',
        role: Role.OperatorAdmin,
      }

      // Create a new user
      const response = await request(app)
        .post('/users')
        .set({ Authorization: `Bearer ${orgAdminToken}` })
        .send(newUser)
      expect(response.status).toBe(201)

      const createdUser = await prisma.user.findFirst({ where: { email: newUser.email } })
      if (!createdUser) {
        throw new Error('User with email already exists')
      }
      expect(createdUser?.email).toBe(newUser.email)
    })
  })

  describe('PATCH /users/:id', () => {
    it('should update a user by ID', async () => {
      const userId: number = PARTICIPANT_UNANSWERED_ID

      const newFirstName: string = 'Updated'

      // Get existing user details
      const existingUser = await prisma.user.findFirst({ where: { id: userId } })

      const testUser: RegisterRequest = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test2@example.com',
        password: 'Password123',
        role: Role.Participant,
      }

      expect(existingUser?.email).toBe(testUser.email)
      expect(existingUser?.firstName).toBe(testUser.firstName)
      expect(existingUser?.lastName).toBe(testUser.lastName)
      expect(existingUser?.role).toBe(testUser.role)

      const response = await request(app)
        .patch(`/users/${userId}`)
        .set({ Authorization: `Bearer ${orgAdminToken}` })
        .send({ firstName: newFirstName })

      expect(response.status).toBe(204)

      // Check if the user is updated successfully
      const updatedUser = await prisma.user.findFirst({ where: { id: userId } })

      expect(updatedUser?.firstName).toBe(newFirstName)
    })

    it('should return an error for a non-existent user', async () => {
      const userId: number = 9999
      const newFirstName: string = 'Updated'
      const response = await request(app)
        .patch(`/users/${userId}`)
        .set({
          Authorization: `Bearer ${orgAdminToken}`,
        })
        .send({ firstName: newFirstName })

      expect(response.status).toBe(404)

      expect(response.body.message).toBe(`User with ID: ${userId} not found`)
    })
  })

  describe('DELETE /users/:id', () => {
    it('should delete a user by ID', async () => {
      const userId: number = PARTICIPANT_UNANSWERED_ID

      // Check that user exists in db
      const existingUser = await prisma.user.findFirst({ where: { id: userId } })

      expect(existingUser).not.toBe(null)
      expect(existingUser?.id).toBe(userId)

      // Delete User
      const response = await request(app)
        .delete(`/users/${userId}`)
        .set({ Authorization: `Bearer ${orgAdminToken}` })

      expect(response.status).toBe(204)

      // Check that user exists in db
      const deletedUser = await prisma.user.findFirst({ where: { id: userId } })

      expect(deletedUser).toBe(null)
    })

    it('should return an error for a non-existent user', async () => {
      const userId: number = 999
      const response = await request(app)
        .delete(`/users/${userId}`)
        .set({ Authorization: `Bearer ${orgAdminToken}` })

      expect(response.status).toBe(404)

      expect(response.body.message).toBe(`User with ID: ${userId} not found`)
    })
  })

  describe('PATCH /users/:id/role', () => {
    it('should update a users role to the role provided', async () => {
      const userID: number = PARTICIPANT_UNANSWERED_ID

      // Check user role
      const existingUser = await prisma.user.findFirst({ where: { id: userID } })

      expect(existingUser?.role).toBe(Role.Participant)

      // Change user role
      const newRole: Role = Role.OperatorAdmin
      const newRoleRequest: UpdateUserRoleRequest = { newRole }

      await request(app)
        .patch(`/users/${userID}/role`)
        .send(newRoleRequest)
        .set({ Authorization: `Bearer ${opAdminToken}` })

      // Check user role
      const updatedUser = await prisma.user.findFirst({ where: { id: userID } })

      expect(updatedUser?.role).toBe(newRole)
    })

    it('should return a Validation Error and keep the same role if the provided role is invalid', async () => {
      const userID: number = PARTICIPANT_UNANSWERED_ID

      // Check user role
      const existingUser = await prisma.user.findFirst({ where: { id: userID } })

      const currentRole: Role | undefined = existingUser?.role

      expect(currentRole).toBe(Role.Participant)

      // Change user role to something invalid
      const newInvalidRole: string = 'InvalidRole'

      const updateUserRoleResponse = await request(app)
        .patch(`/users/${userID}/role`)
        .send({ newRole: newInvalidRole })
        .set({ Authorization: `Bearer ${opAdminToken}` })

      expect(updateUserRoleResponse.status).toBe(422)

      // Check user role hasn't changed
      const updatedUser = await prisma.user.findFirst({ where: { id: userID } })

      expect(updatedUser?.role).toBe(currentRole)
    })

    it('should return an error for a non-existent user', async () => {
      const userID: number = 999
      const newRole: Role = Role.OperatorAdmin

      const response = await request(app)
        .patch(`/users/${userID}/role`)
        .send({ newRole })
        .set({ Authorization: `Bearer ${opAdminToken}` })

      expect(response.status).toBe(404)

      expect(response.body.message).toBe(`User with ID: ${userID} not found`)
    })
  })
})
