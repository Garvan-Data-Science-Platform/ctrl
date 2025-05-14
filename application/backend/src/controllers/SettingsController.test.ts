import request from 'supertest'
import { generateToken } from '../authentication'
import { Api } from '../Api'
import { resetDB, updateLogo } from 'common/testing/TestHelpers'
import { ORG_ADMIN_ID } from 'common/testing/seed'
import prisma from '../PrismaClient'
import * as crypto from 'crypto'

const api = new Api()
const app = api.app

describe('SettingsController', () => {
  let orgAdminToken: string

  beforeAll(async () => {
    orgAdminToken = await generateToken({
      userId: ORG_ADMIN_ID,
      roles: ['OrganisationAdmin'],
    })

    api.run()
  })

  beforeEach(async () => {
    await resetDB()
  })

  afterAll(async () => {
    api.stop()
  })

  const expectedSettings = {
    mailerHost: 'smtp.ethereal.email',
    mailerPort: 587,
    mailerPassword: 'b7nS4Ge8gCvHUzq6Rf',
    mailerUser: 'eduardo.boyer@ethereal.email',
    redcapToken: 'ABC',
    redcapURL: 'http://redcaptest.com',
    primaryColour: null,
    secondaryColour: null,
  }

  describe('GET /settings', () => {
    it('should return current settings', async () => {
      // Get user profile
      const response = await request(app)
        .get(`/settings`)
        .set({ Authorization: `Bearer ${orgAdminToken}` })

      expect(response.status).toBe(200)

      expect(response.body.data).toEqual(expectedSettings)
    })
  })

  describe('PATCH /settings', () => {
    it('should update settings', async () => {
      const reqBody = { mailerHost: null, redcapToken: 'XXX' }
      const response = await request(app)
        .patch('/settings')
        .set({ Authorization: `Bearer ${orgAdminToken}` })
        .send(reqBody)

      expect(response.status).toBe(204)

      const newSettings = await prisma.organisation.findFirstOrThrow({ where: { id: 1 } })
      expect(newSettings.mailerHost).toBe(null)
      expect(newSettings.redcapToken).toBe('XXX')
    })

    it('should fail to update if settings are invalid', async () => {
      const reqBody = { mailerHost: 1 }

      const response = await request(app)
        .patch('/settings')
        .set({ Authorization: `Bearer ${orgAdminToken}` })
        .send(reqBody)

      expect(response.status).toBe(422)
    })
  })

  describe('GET /settings/theme', () => {
    it('should return theme', async () => {
      const response = await request(app).get(`/settings/theme`)

      expect(response.status).toBe(200)
      expect(response.body.data).toEqual({ primaryColour: null, secondaryColour: null })
    })
  })

  describe('GET /settings/logo', () => {
    it('should return blank logo if no logo has been updated', async () => {
      const response = await request(app).get(`/settings/logo`).responseType('blob')
      const b64 = response.body.toString('base64')
      const hash = crypto.createHash('md5').update(b64).digest('hex')
      expect(hash).toEqual('4b8664db5ef2b1deb13816008bc993ad')
      expect(response.status).toBe(200)
    })
    it('should return non-blank logo if logo has been uploaded', async () => {
      await updateLogo('tests/test_data/valid_logo.png')
      const response = await request(app).get(`/settings/logo`).responseType('blob')
      const b64 = response.body.toString('base64')
      const hash = crypto.createHash('md5').update(b64).digest('hex')
      expect(hash).toEqual('3516708b3c454102feef80e62a8b330a')
      expect(response.status).toBe(200)
    })
  })
  describe('POST /settings/logo', () => {
    it('should update the logo if valid', async () => {
      const response = await request(app)
        .post('/settings/logo')
        .set({ Authorization: `Bearer ${orgAdminToken}` })
        .attach('file', 'tests/test_data/valid_logo.png')

      expect(response.status).toBe(204)
    })

    it('should fail to update invalid logo', async () => {
      const response = await request(app)
        .post('/settings/logo')
        .set({ Authorization: `Bearer ${orgAdminToken}` })
        .attach('file', 'tests/test_data/invalid_logo.png')

      expect(response.status).toBe(500)
    })
  })
})
