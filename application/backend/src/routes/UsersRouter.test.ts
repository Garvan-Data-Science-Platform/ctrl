import request from 'supertest'
import express from 'express'
import { UsersRouter } from './UsersRouter'
import Database from '../Database'

jest.mock('../Database', () => {
  const originalModule = jest.requireActual('../Database')
  return {
    __esModule: true,
    ...originalModule,
    getInstance: jest.fn(),
  }
})

const mockQuery = jest.fn()
jest.spyOn(Database, 'getInstance').mockReturnValue({
  query: mockQuery,
} as unknown as Database)

// Create a new Express application for testing
const app = express()

app.use(express.json())
app.use('/users', UsersRouter()) // Mount the router

describe('UsersRouter', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /users', () => {
    it('should return an empty list if no users have been created status 200', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] })

      const response = await request(app).get('/users')
      expect(response.status).toBe(200)
      expect(response.body).toEqual({ data: { msg: 'Got all users', users: [] } })
    })

    it('should return the created users full information status 200', async () => {
      const mockUser1 = {
        id: 1,
        firstName: 'John',
        email: 'jsmith@email.com',
        role: 'Data Scientist',
        organisations: ['Garvan Institute'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const mockUser2 = {
        id: 1,
        firstName: 'Joe',
        email: 'jdoe@email.com',
        role: 'Data Analyst',
        organisations: ['ABC. Corp'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      mockQuery.mockResolvedValueOnce({ rows: [mockUser1, mockUser2] })

      const response = await request(app).get('/users')
      expect(response.status).toBe(200)

      const responseUsers = response.body.data.users
      expect(responseUsers).toHaveLength(2)

      expect(responseUsers[0].id).toEqual(mockUser1.id)
      expect(responseUsers[0].firstName).toEqual(mockUser1.firstName)
      expect(responseUsers[0].email).toEqual(mockUser1.email)
      expect(responseUsers[0].role).toEqual(mockUser1.role)
      expect(responseUsers[0].organisations).toEqual(mockUser1.organisations)
      expect(responseUsers[0]).toHaveProperty('createdAt')
      expect(responseUsers[0]).toHaveProperty('updatedAt')

      expect(responseUsers[1].id).toEqual(mockUser2.id)
      expect(responseUsers[1].firstName).toEqual(mockUser2.firstName)
      expect(responseUsers[1].email).toEqual(mockUser2.email)
      expect(responseUsers[1].role).toEqual(mockUser2.role)
      expect(responseUsers[1].organisations).toEqual(mockUser2.organisations)
      expect(responseUsers[1]).toHaveProperty('createdAt')
      expect(responseUsers[1]).toHaveProperty('updatedAt')
    })
  })

  describe('GET /users/:id', () => {
    it('should return an error if the user does not exist status 404', async () => {
      const testingUserID = 2
      mockQuery.mockResolvedValueOnce({ rows: [] })

      const response = await request(app).get(`/users/${testingUserID}`)
      expect(response.status).toBe(404)
      expect(response.body).toEqual({ error: { msg: `User w/ ID: ${testingUserID} not found` } })
    })

    it('should return the user with the given id status 200', async () => {
      const mockUser = {
        id: 1,
        firstName: 'John',
        email: 'jsmith@email.com',
        role: 'Data Scientist',
        organisations: ['Garvan Institute'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const testingUserID = 1
      mockQuery.mockResolvedValueOnce({ rows: [mockUser] })

      const response = await request(app).get(`/users/${testingUserID}`)
      expect(response.status).toBe(200)

      const responseUser = response.body.data.user
      expect(responseUser.id).toEqual(mockUser.id)
      expect(responseUser.firstName).toEqual(mockUser.firstName)
      expect(responseUser.email).toEqual(mockUser.email)
      expect(responseUser.role).toEqual(mockUser.role)
      expect(responseUser.organisations).toEqual(mockUser.organisations)
      expect(responseUser).toHaveProperty('createdAt')
      expect(responseUser).toHaveProperty('updatedAt')
    })
  })

  describe('POST /users', () => {
    it('should return an error if the required fields are not provided status 400', async () => {
      const newUser = {}
      const response = await request(app).post('/users').send(newUser)
      expect(response.status).toBe(400)
      expect(response.body).toEqual({
        error: {
          msg: 'Missing required fields: first_name, email, role, organisations',
        },
      })
    })

    it('should create a new user given first_name, email, role and organisations status 200', async () => {
      const newUser = {
        firstName: 'Jane Doe',
        email: 'jdoe@email.com',
        role: 'Software Engineer',
        organisations: ['ABC Corp'],
      }

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            ...newUser,
            id: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      })

      const response = await request(app).post('/users').send(newUser)
      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        data: {
          msg: 'Created user w/ ID: undefined',
          newUser: {
            id: 1,
            ...newUser,
            createdAt: expect.anything(),
            updatedAt: expect.anything(),
          },
        },
      })

      const { createdAt, updatedAt } = response.body.data.newUser
      expect(new Date(createdAt).toString()).not.toBe('Invalid Date')
      expect(new Date(updatedAt).toString()).not.toBe('Invalid Date')
    })
  })

  describe('PUT /users/:id', () => {
    it('should return an error if the user does not exist status 404', async () => {
      const testingUserID = 2
      const updatedUser = {
        firstName: 'Jane',
        email: 'jdoe@email.com',
        role: 'Software Engineer',
        organisations: ['ABC Corp'],
      }

      mockQuery.mockResolvedValueOnce({ rows: [] })

      const response = await request(app).put(`/users/${testingUserID}`).send(updatedUser)
      expect(response.status).toBe(404)
      expect(response.body).toEqual({ error: { msg: `User w/ ID: ${testingUserID} not found` } })
    })

    it('should update the user with the given id status 200', async () => {
      const mockUser = {
        id: 1,
        firstName: 'John',
        email: 'jsmith@email.com',
        role: 'Data Scientist',
        organisations: ['Garvan Institute'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const testingUserID = 1
      const updateUser = {
        firstName: 'Jane',
        email: 'jdoe@email.com',
        role: 'Software Engineer',
      }

      mockQuery.mockResolvedValue({
        rows: [
          {
            ...mockUser,
            ...updateUser,
            updatedAt: new Date().toISOString(),
          },
        ],
      })

      const response = await request(app).put(`/users/${testingUserID}`).send(updateUser)
      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        data: {
          msg: `Update user w/ ID: ${testingUserID}`,
          updatedUser: {
            id: testingUserID,
            firstName: updateUser.firstName,
            email: updateUser.email,
            role: updateUser.role,
            organisations: mockUser.organisations,
            createdAt: expect.anything(),
            updatedAt: expect.anything(),
          },
        },
      })

      const { createdAt, updatedAt } = response.body.data.updatedUser
      expect(new Date(createdAt).toString()).not.toBe('Invalid Date')
      expect(new Date(updatedAt).toString()).not.toBe('Invalid Date')
    })

    it('should only update the values that were given in the body status 200', async () => {
      const mockUser = {
        id: 1,
        firstName: 'John',
        email: 'jsmith@email.com',
        role: 'Data Scientist',
        organisations: ['Garvan Institute'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const testingUserID = 1
      const updatedUser = {
        firstName: 'Jane',
        email: 'jdoe@email.com',
        role: 'Software Engineer',
      }

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            ...mockUser,
            ...updatedUser,
            updatedAt: new Date().toISOString(),
          },
        ],
      })

      const response = await request(app).put(`/users/${testingUserID}`).send(updatedUser)
      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        data: {
          msg: `Update user w/ ID: ${testingUserID}`,
          updatedUser: {
            id: testingUserID,
            firstName: updatedUser.firstName,
            email: updatedUser.email,
            role: updatedUser.role,
            organisations: mockUser.organisations,
            createdAt: expect.anything(),
            updatedAt: expect.anything(),
          },
        },
      })

      const { createdAt, updatedAt } = response.body.data.updatedUser
      expect(new Date(createdAt).toString()).not.toBe('Invalid Date')
      expect(new Date(updatedAt).toString()).not.toBe('Invalid Date')
    })
  })

  describe('DELETE /users/:id', () => {
    it('should return an error if the user does not exist status 404', async () => {
      const testingUserID = 2
      mockQuery.mockResolvedValueOnce({ rows: [] })

      const response = await request(app).delete(`/users/${testingUserID}`)
      expect(response.status).toBe(404)
      expect(response.body).toEqual({ error: { msg: `User w/ ID: ${testingUserID} not found` } })
    })

    it('should delete the user with the given id status 200', async () => {
      const testingUserID = 1
      const mockUser = {
        id: testingUserID,
        firstName: 'John',
        email: 'jsmith@email.com',
        role: 'Data Scientist',
        organisations: ['Garvan Institute'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      mockQuery.mockResolvedValueOnce({ rows: [mockUser] })
      mockQuery.mockResolvedValueOnce({ rows: [] })

      const response = await request(app).delete(`/users/${testingUserID}`)

      const expectedResponse = {
        data: {
          msg: `Deleted user w/ ID: ${testingUserID}`,
          deletedUser: {
            id: mockUser.id,
            firstName: mockUser.firstName,
            email: mockUser.email,
            role: mockUser.role,
            organisations: mockUser.organisations,
            createdAt: expect.anything(),
            updatedAt: expect.anything(),
          },
        },
      }
      expect(response.status).toBe(200)
      expect(response.body).toEqual(expectedResponse)
    })
  })
})
