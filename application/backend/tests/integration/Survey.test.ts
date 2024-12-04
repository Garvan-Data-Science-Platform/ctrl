import request from 'supertest'
import { generateToken } from '../../src/authentication'
import { Api } from '../../src/Api'
import { Role } from '@prisma/client'
import { resetDB } from '../TestHelpers'

const api = new Api()
const app = api.app

describe('Survey tests', () => {
  beforeAll(async () => {
    api.run()
    await resetDB()
  })

  afterAll(async () => {
    api.stop()
  })

  it('Publishing an initial survey', () => {})

  it('User registers and sees current survey version', () => {})

  it('User submits answers and they are visible to survey admin', () => {})

  it('Admin publishes another survey version and user sees new questions, status is correct for admin', () => {})

  it('User partially completes new survey, admin sees correct status', () => {})

  it('User completes survey, admin and user see correct status and dates', () => {})
})
