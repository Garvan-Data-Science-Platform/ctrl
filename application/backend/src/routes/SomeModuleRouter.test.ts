import request from 'supertest'
import express from 'express'
import { SomeModuleRouter } from './SomeModuleRouter'
import * as SomeModule from '../SomeModule' // Adjust the path accordingly

// Create a new Express application for testing
const app = express()
app.use(express.json())
app.use('/somemodule', SomeModuleRouter()) // Mount the router

// Mock the add and subtract functions
jest.mock('../SomeModule', () => ({
  add: jest.fn(),
  subtract: jest.fn(),
}))

const mockedAdd = SomeModule.add as jest.MockedFunction<typeof SomeModule.add>
const mockedSubtract = SomeModule.subtract as jest.MockedFunction<typeof SomeModule.subtract>

describe('SomeModuleRouter', () => {
  describe('POST /somemodule/add', () => {
    it('should return the sum of two numbers', async () => {
      mockedAdd.mockReturnValue(5) // Mock implementation
      const requestBody = { num1: 2, num2: 3 }

      const response = await request(app).post('/somemodule/add').send(requestBody)

      expect(response.status).toBe(200)
      expect(response.body).toEqual({ result: 5 })
      expect(SomeModule.add).toHaveBeenCalledWith(2, 3)
    })
  })

  describe('POST /somemodule/subtract', () => {
    it('should return the difference of two numbers', async () => {
      mockedSubtract.mockReturnValue(1) // Mock implementation
      const requestBody = { num1: 4, num2: 3 }

      const response = await request(app).post('/somemodule/subtract').send(requestBody)

      expect(response.status).toBe(200)
      expect(response.body).toEqual({ result: 1 })
      expect(SomeModule.subtract).toHaveBeenCalledWith(4, 3)
    })
  })

  describe('GET /somemodule', () => {
    it('should return an empty object with status 200', async () => {
      const response = await request(app).get('/somemodule')

      expect(response.status).toBe(200)
      expect(response.body).toEqual({})
    })
  })
})
