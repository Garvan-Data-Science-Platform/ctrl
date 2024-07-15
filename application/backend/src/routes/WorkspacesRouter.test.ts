import request from 'supertest'
import express from 'express'
import { WorkspacesRouter } from './WorkspacesRouter'

// Create a new Express application for testing
const app = express()
app.use('/workspaces', WorkspacesRouter())

describe('GET /workspaces', () => {
  it('should return a list of workspaces and their versions with status 200', async () => {
    const response = await request(app).get('/workspaces')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      data: [
        { name: 'backend', version: '1.0.0' },
        { name: 'common', version: '1.0.0' },
        { name: 'frontend', version: '1.0.0' },
      ],
    })
  })
})
