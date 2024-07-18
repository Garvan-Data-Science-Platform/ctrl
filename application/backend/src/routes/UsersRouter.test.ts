import request from 'supertest'
import express from 'express'
import { UsersRouter, users } from './UsersRouter'
import { User } from '../entities/User'

// Create a new Express application for testing
const app = express()

app.use(express.json())
app.use('/users', UsersRouter()) // Mount the router

describe('UsersRouter', () => {
  beforeEach(() => {
    users.length = 0
  })
  describe('GET /users', () => {
    it('should return an empty list if no users have been created status 200', async () => {
      const response = await request(app).get('/users')
      expect(response.status).toBe(200)
      expect(response.body).toEqual({ data: users })
    })

    it('should return the created users full information status 200', async () => {
      users.push(
        new User(1, 'John Smith', 'jsmith@email.com', 'Data Scientist', ['Garvan Institute']),
      )
      const response = await request(app).get('/users')
      expect(response.status).toBe(200)

      const responseUsers = response.body.data
      expect(responseUsers.length).toEqual(1)
      expect(parseInt(responseUsers[0].id, 10)).toEqual(1)
      expect(responseUsers[0].name).toEqual('John Smith')
      expect(responseUsers[0].email).toEqual('jsmith@email.com')
      expect(responseUsers[0].role).toEqual('Data Scientist')
      expect(responseUsers[0].organisations).toEqual(['Garvan Institute'])
      // TODO: Need to check createdAt and updatedAt (think about using unix timestamp)
    })
  })
  describe('POST /users', () => {
    it('should create a new user given name, email, role and organisations status 200', async () => {
      const newUser = {
        name: 'Jane Doe',
        email: 'jdoe@email.com',
        role: 'Software Engineer',
        organisations: ['ABC Corp'],
      }
      const response = await request(app).post('/users').send(newUser)
      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        data: {
          id: 1,
          name: 'Jane Doe',
          email: 'jdoe@email.com',
          role: 'Software Engineer',
          organisations: ['ABC Corp'],
          createdAt: expect.anything(), // TODO: Should check this properly
          updatedAt: expect.anything(), // TODO: Should check this properly
        },
      })
    })
    // TODO: Implement Error handling tests
  })
})
