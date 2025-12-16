import request from 'supertest'
import { generateToken } from '../authentication'
import { Api } from '../Api'
import { resetDB, updateOrgLogo } from 'common/testing/TestHelpers'
import { PROCESSED_VALID_LOGO_MD5 } from 'common/testing/fixtures'
import { ORG_ADMIN_ID } from 'common/testing/seed'
import prisma from '../PrismaClient'
import { createHash } from 'crypto'

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
    primaryColour: 'red',
    secondaryColour: 'red',
    tcLink: 'https://garvan-data-science-platform.github.io/ctrl-docs/docs/terms-and-conditions',
    newsLink: 'https://ctrldynamicconsent.wordpress.com',
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
      const reqBody = { primaryColour: 'blue' }
      const response = await request(app)
        .patch('/settings')
        .set({ Authorization: `Bearer ${orgAdminToken}` })
        .send(reqBody)

      expect(response.status).toBe(204)

      const newSettings = await prisma.organisation.findFirstOrThrow({ where: { id: 1 } })
      expect(newSettings.primaryColour).toBe('blue')
    })

    it('should fail to update if settings are invalid', async () => {
      const reqBody = { primaryColour: 1 }

      const response = await request(app)
        .patch('/settings')
        .set({ Authorization: `Bearer ${orgAdminToken}` })
        .send(reqBody)

      expect(response.status).toBe(422)
    })
  })

  describe('GET /settings/userportal', () => {
    it('should return settings for user portal', async () => {
      const response = await request(app).get(`/settings/userportal`)

      expect(response.status).toBe(200)
      expect(response.body.data).toEqual({
        primaryColour: 'red',
        secondaryColour: 'red',
        newsLink: 'https://ctrldynamicconsent.wordpress.com',
      })
    })
  })

  describe('GET /settings/logo', () => {
    it('should return 404 if no logo has been uploaded', async () => {
      const response = await request(app).get(`/settings/logo`).responseType('blob')
      expect(response.status).toBe(404)
    })
    it('should return non-blank logo if logo has been uploaded', async () => {
      await updateOrgLogo('tests/test_data/valid_logo.png')
      const response = await request(app).get(`/settings/logo`).responseType('blob')
      const b64 = response.body.toString('base64')
      const hash = createHash('md5').update(b64).digest('hex')
      expect(hash).toEqual(PROCESSED_VALID_LOGO_MD5)
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

      expect(response.status).toBe(422)
    })
  })
})
