import request from 'supertest'
import { generateToken } from '../authentication'
import { Api } from '../Api'
import { resetDB, updateLogo } from 'common/testing/TestHelpers'
import logoHashes from '../../../common/testing/fixtures/logo_hashes.json'
import { TestUsers } from 'common/testing/constants'
import prisma from '../PrismaClient'
import { createHash } from 'crypto'

const fixturesPath = '../common/testing/fixtures/'

const api = new Api()
const app = api.app

describe('SettingsController', () => {
  let orgAdminToken: string

  beforeAll(async () => {
    orgAdminToken = await generateToken({
      userId: TestUsers.ORG_ADMIN.id,
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
    logoSet: null, // This is used to tell the admin-client if there is a logo set
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

    it('should fail to update if newsLink does not match URL Regex', async () => {
      const reqBody = { newsLink: 'string' }

      const response = await request(app)
        .patch('/settings')
        .set({ Authorization: `Bearer ${orgAdminToken}` })
        .send(reqBody)

      expect(response.status).toBe(422)
    })

    it('should fail to update if tcLink does not match URL Regex', async () => {
      const reqBody = { tcLink: 'string' }

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
      await updateLogo({
        target: 'organisation',
        filePath: `${fixturesPath}/valid_logo.png`,
      })
      const response = await request(app).get(`/settings/logo`).responseType('blob')
      const hash = createHash('md5').update(response.body).digest('hex')
      expect(hash).toEqual(logoHashes.validLogoResizedHash)
      expect(response.status).toBe(200)
    })
  })

  describe('POST /settings/logo', () => {
    it('should poste the logo if valid', async () => {
      const response = await request(app)
        .post('/settings/logo')
        .set({ Authorization: `Bearer ${orgAdminToken}` })
        .attach('file', `${fixturesPath}/valid_logo.png`)

      expect(response.status).toBe(204)
    })

    it('should fail to update invalid logo', async () => {
      const response = await request(app)
        .post('/settings/logo')
        .set({ Authorization: `Bearer ${orgAdminToken}` })
        .attach('file', `${fixturesPath}/invalid_logo.png`)

      expect(response.status).toBe(422)
    })

    it('should change logo if a logo gets updated', async () => {
      // Post logo
      const originalLogoPostResponse = await request(app)
        .post(`/settings/logo`)
        .set({ Authorization: `Bearer ${orgAdminToken}` })
        .attach('file', `${fixturesPath}/valid_logo.png`)
      expect(originalLogoPostResponse.status).toBe(204)
      const originalLogoGetResponse = await request(app).get(`/settings/logo`).responseType('blob')
      const originalLogoHash = createHash('md5').update(originalLogoGetResponse.body).digest('hex')
      expect(originalLogoHash).toEqual(logoHashes.validLogoResizedHash)
      expect(originalLogoGetResponse.status).toBe(200)
      // Update logo
      const alternateLogoPostResponse = await request(app)
        .post(`/settings/logo`)
        .set({ Authorization: `Bearer ${orgAdminToken}` })
        .attach('file', `${fixturesPath}/alternate_logo.png`)
      expect(alternateLogoPostResponse.status).toBe(204)
      // Test logo has changed
      const alternateLogoGetResponse = await request(app).get(`/settings/logo`).responseType('blob')
      const alternateLogoHash = createHash('md5')
        .update(alternateLogoGetResponse.body)
        .digest('hex')
      expect(alternateLogoHash).toEqual(logoHashes.alternateLogoResizedHash)
      expect(alternateLogoGetResponse.status).toBe(200)
    })
  })

  // TODO: Add test to verify that study admin cannot change logo

  describe('DELETE /settings/logo', () => {
    it('should delete an existing org logo', async () => {
      // Add a logo to be deleted
      const createResponse = await request(app)
        .post(`/settings/logo`)
        .set({ Authorization: `Bearer ${orgAdminToken}` })
        .attach('file', `${fixturesPath}/valid_logo.png`)
      expect(createResponse.status).toBe(204)

      // Test deletion
      const response = await request(app)
        .delete(`/settings/logo`)
        .set({ Authorization: `Bearer ${orgAdminToken}` })
      expect(response.status).toBe(204)

      // Try to get logo (expecting 404)
      const getResponse = await request(app).get(`/settings/logo`).responseType('blob')
      expect(getResponse.status).toBe(404)

      // Verify logo is deleted in db
      const orgWithDeletedLogo = await prisma.organisation.findFirst({
        where: { id: 1 }, // Hard coded due to not yet supporting multitenancy.
      })
      expect(orgWithDeletedLogo?.logo).toBeNull()
    })
  })
})
