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

  describe('GET /users/:id', () => {
    beforeEach(() => {
      users.push(
        new User(1, 'John Smith', 'jsmith@email.com', 'Data Scientist', ['Garvan Institute']),
      )
    })

    it('should return an error if the user does not exist status 404', async () => {
      const testingUserID = 2
      const response = await request(app).get(`/users/${testingUserID}`)
      expect(response.status).toBe(404)
      expect(response.body).toEqual({ error: { msg: `User w/ ID: ${testingUserID} not found` } })
    })

    it('should return the user with the given id status 200', async () => {
      const testingUserID = 1
      const response = await request(app).get(`/users/${testingUserID}`)
      expect(response.status).toBe(200)

      const responseUser = response.body.data
      expect(parseInt(responseUser.id, 10)).toEqual(testingUserID)
      expect(responseUser.name).toEqual('John Smith')
      expect(responseUser.email).toEqual('jsmith@email.com')
      expect(responseUser.role).toEqual('Data Scientist')
      expect(responseUser.organisations).toEqual(['Garvan Institute'])
      // TODO: Need to check createdAt and updatedAt (think about using unix timestamp)
    })
  })

  describe('POST /users', () => {
    it('should return an error if the required fields are not provided status 400', async () => {
      const newUser = {}
      const response = await request(app).post('/users').send(newUser)
      expect(response.status).toBe(400)
      expect(response.body).toEqual({
        error: {
          msg: 'Missing required fields: name, email, role, organisations',
        },
      })
    })

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
  })

  // TODO: Update User details testing

  describe('DELETE /users/:id', () => {
    beforeEach(() => {
      users.push(
        new User(1, 'John Smith', 'jsmith@email.com', 'Data Scientist', ['Garvan Institute']),
      )
    })

    it('should return an error if the user does not exist status 404', async () => {
      const testingUserID = 2
      const response = await request(app).delete(`/users/${testingUserID}`)
      expect(response.status).toBe(404)
      expect(response.body).toEqual({ error: { msg: `User w/ ID: ${testingUserID} not found` } })
    })

    it('should delete the user with the given id status 200', async () => {
      expect(users.length).toBe(1)
      const response = await request(app).delete('/users/1')
      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        data: [],
      })
      expect(users.length).toBe(0)
    })
  })
})
