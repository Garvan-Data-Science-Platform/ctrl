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
      expect(response.body).toEqual({ data: [] })
    })

    it('should return the created users full information status 200', async () => {
      const mockUser = {
        id: 1,
        firstName: 'John',
        email: 'jsmith@email.com',
        role: 'Data Scientist',
        organisations: ['Garvan Institute'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      mockQuery.mockResolvedValueOnce({ rows: [mockUser] })

      const response = await request(app).get('/users')
      expect(response.status).toBe(200)
      expect(response.body.data.length).toEqual(1)

      const responseUser = response.body.data[0]
      expect(responseUser.id).toEqual(mockUser.id)
      expect(responseUser.firstName).toEqual(mockUser.firstName)
      expect(responseUser.email).toEqual(mockUser.email)
      expect(responseUser.role).toEqual(mockUser.role)
      expect(responseUser.organisations).toEqual(mockUser.organisations)
      expect(responseUser).toHaveProperty('createdAt')
      expect(responseUser).toHaveProperty('updatedAt')
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

      const responseUser = response.body.data
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
          id: 1,
          ...newUser,
          createdAt: expect.anything(),
          updatedAt: expect.anything(),
        },
      })

      const { createdAt, updatedAt } = response.body.data
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
      const mockUser = {
        id: 1,
        firstName: 'John',
        email: 'jsmith@email.com',
        role: 'Data Scientist',
        organisations: ['Garvan Institute'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      mockQuery.mockResolvedValueOnce({ rows: [mockUser] })
      mockQuery.mockResolvedValueOnce({ rows: [] })

      const response = await request(app).delete('/users/1')
      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        data: {},
      })
    })
  })
})
