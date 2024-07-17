import request from 'supertest'
import express from 'express'
import { UsersRouter } from './UsersRouter'

// Create a new Express application for testing
const app = express()

app.use(express.json())
app.use('/users', UsersRouter()) // Mount the router

describe('UsersRouter', () => {
  describe('GET /users', () => {
    it('should return an empty list if no users have been created status 200', async () => {
      const response = await request(app).get('/users')
      expect(response.status).toBe(200)
      expect(response.body).toEqual({ data: [] })
    })
  })
})
