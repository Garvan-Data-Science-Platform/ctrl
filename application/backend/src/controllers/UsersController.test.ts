import request from 'supertest'
import { Api } from '../Api'
import type { RegisterRequest, RegisterResponse } from 'common/types/api/auth'
import prisma from '../PrismaClient'
import {
  CreateUserResponse,
  DeleteUserResponse,
  GetAllUsersResponse,
  GetUserByIdResponse,
  UpdateUserResponse,
} from 'common/types/api/users'
import { resetDB } from '../TestHelpers'
import { getUserIdFromToken } from '../authentication'

const api = new Api()
const app = api.app

describe('UsersController', () => {
  let token: string
  let registeredUserID: number

  const testUser: RegisterRequest = {
    firstName: 'Test',
    lastName: 'User',
    email: 'test@user.com',
    password: 'password123',
    role: 'test',
  }

  beforeAll(async () => {
    api.run()
  })

  beforeEach(async () => {
    await resetDB()

    // Register user
    const registerResponse = await request(app).post('/auth/register').send(testUser)
    const body: RegisterResponse = registerResponse.body
    if (!body.token) throw new Error()
    token = body.token
    registeredUserID = getUserIdFromToken(token)
  })

  afterAll(async () => {
    api.stop()
  })

  describe('GET /users', () => {
    it('should be a protected route', async () => {
      const response = await request(app).get('/users')
      expect(response.status).toBe(401)

      const body: GetAllUsersResponse = response.body
      expect(body.message).toBe('No token provided')
    })

    it('should return a list of users', async () => {
      const response = await request(app)
        .get('/users')
        .set({ Authorization: `Bearer ${token}` })
      expect(response.status).toBe(200)

      const body: GetAllUsersResponse = response.body
      expect(body).toHaveProperty('users')
    })

    it('should return a 500 error if a database error occurs', async () => {
      jest.spyOn(prisma.user, 'findMany').mockImplementationOnce(() => {
        throw new Error('Internal Server Error')
      })
      const response = await request(app)
        .get('/users')
        .set({ Authorization: `Bearer ${token}` })

      expect(response.status).toBe(500)

      const body: GetAllUsersResponse = response.body
      expect(body.users).toBe(undefined)
    })
  })

  describe('GET /users/:id', () => {
    it('should be a protected route', async () => {
      const response = await request(app).get('/users/1')
      expect(response.status).toBe(401)

      const body: GetUserByIdResponse = response.body
      expect(body.message).toBe('No token provided')
    })

    it('should return a user by ID', async () => {
      const userID = registeredUserID
      const response = await request(app)
        .get(`/users/${userID}`)
        .set({ Authorization: `Bearer ${token}` })

      expect(response.status).toBe(200)

      const body: GetUserByIdResponse = response.body
      expect(body.message).toBe(`Got user with ID: ${userID}`)
      expect(body).toHaveProperty('user')
    })

    it('should return an error for a non-existent user', async () => {
      const userID = 9999
      const response = await request(app)
        .get(`/users/${userID}`)
        .set({
          Authorization: `Bearer ${token}`,
        })

      expect(response.status).toBe(404)

      const body: GetUserByIdResponse = response.body
      expect(body.message).toBe(`User with ID: ${userID} not found`)
      expect(body.user).toBe(null)
    })
  })

  describe('POST /users', () => {
    it('should be a protected route', async () => {
      const response = await request(app).post('/users').send({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        password: 'password123',
        role: 'user',
      })

      expect(response.status).toBe(401)

      const body: CreateUserResponse = response.body
      expect(body.message).toBe('No token provided')
    })

    it('should create a new user', async () => {
      const newUser = {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        password: 'password123',
        role: 'user',
      }

      // Check that the user does not already exist
      const existingUser = await prisma.user.findFirst({ where: { email: newUser.email } })
      if (existingUser) {
        throw new Error('User with email already exists')
      }

      // Create a new user
      const response = await request(app)
        .post('/users')
        .set({ Authorization: `Bearer ${token}` })
        .send(newUser)
      expect(response.status).toBe(201)

      const body: CreateUserResponse = response.body
      expect(body.message).toMatch(/Created user with ID: \d+/)

      const createdUser = await prisma.user.findFirst({ where: { email: newUser.email } })
      if (!createdUser) {
        throw new Error('User with email already exists')
      }
      expect(createdUser?.email).toBe(newUser.email)
    })
  })

  describe('PATCH /users/:id', () => {
    it('should be a protected route', async () => {
      const response = await request(app).patch('/users/1').send({ firstName: 'Updated' })
      expect(response.status).toBe(401)

      const body: UpdateUserResponse = response.body
      expect(body.message).toBe('No token provided')
    })

    it('should update a user by ID', async () => {
      const userID: number = registeredUserID

      const newFirstName: string = 'Updated'

      // Get existing user details
      const existingUser = await prisma.user.findFirst({ where: { id: userID } })

      expect(existingUser?.email).toBe(testUser.email)
      expect(existingUser?.firstName).toBe(testUser.firstName)
      expect(existingUser?.lastName).toBe(testUser.lastName)
      expect(existingUser?.role).toBe(testUser.role)

      const response = await request(app)
        .patch(`/users/${userID}`)
        .set({ Authorization: `Bearer ${token}` })
        .send({ firstName: newFirstName })

      expect(response.status).toBe(200)

      const body: UpdateUserResponse = response.body
      expect(body.message).toBe(`Updated user with ID: ${userID}`)
      expect(body.updatedUser?.firstName).toBe(newFirstName)

      // Check if the user is updated successfully
      const updatedUser = await prisma.user.findFirst({ where: { id: userID } })

      expect(updatedUser?.firstName).toBe(newFirstName)
    })

    it('should return an error for a non-existent user', async () => {
      const userID: number = 9999
      const newFirstName: string = 'Updated'
      const response = await request(app)
        .patch(`/users/${userID}`)
        .set({
          Authorization: `Bearer ${token}`,
        })
        .send({ firstName: newFirstName })

      expect(response.status).toBe(404)

      const body: UpdateUserResponse = response.body
      expect(body.message).toBe(`User with ID: ${userID} not found`)
      expect(body.updatedUser).toBe(null)
    })
  })

  describe('DELETE /users/:id', () => {
    it('should be a protected route', async () => {
      const response = await request(app).delete('/users/1')
      expect(response.status).toBe(401)

      const body: UpdateUserResponse = response.body
      expect(body.message).toBe('No token provided')
    })

    it('should delete a user by ID', async () => {
      const userID: number = registeredUserID

      // Check that user exists in db
      const existingUser = await prisma.user.findFirst({ where: { id: userID } })

      expect(existingUser).not.toBe(null)
      expect(existingUser?.id).toBe(userID)

      // Delete User
      const response = await request(app)
        .delete(`/users/${userID}`)
        .set({ Authorization: `Bearer ${token}` })

      expect(response.status).toBe(200)

      const body: DeleteUserResponse = response.body
      expect(body.message).toBe(`Deleted user with ID: ${userID}`)

      // Check that user exists in db
      const deletedUser = await prisma.user.findFirst({ where: { id: userID } })

      expect(deletedUser).toBe(null)
    })

    it('should return an error for a non-existent user', async () => {
      const userID: number = 999
      const response = await request(app)
        .delete(`/users/${userID}`)
        .set({ Authorization: `Bearer ${token}` })

      expect(response.status).toBe(404)

      const body: DeleteUserResponse = response.body
      expect(body.message).toBe(`User with ID: ${userID} not found`)
    })
  })
})
