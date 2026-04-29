import request from 'supertest'
import { Api } from '../Api'
import prisma from '../PrismaClient'
import { Role } from '@prisma/client'
import { resetDB, seedAuditLogs } from 'common/testing/TestHelpers'
import { defaultAuditLogsPageSize } from 'common/src/config'
import { generateToken } from '../authentication'
import type { GetAuditLogsResponse } from 'common/types/api/audit-logs'
import { ORG_ADMIN_ID, PARTICIPANT_UNANSWERED_ID, STUDY_ADMIN_ID } from 'common/testing/seed'
import { UpdateStudyRequest } from 'common/types/api/studies'
import type { RegisterRequest } from 'common/types/api/auth'
const api = new Api()
const app = api.app

describe('AuditLogsController', () => {
  let participantToken: string
  let orgAdminToken: string
  let studyAdminToken: string

  beforeAll(async () => {
    participantToken = await generateToken({ userId: PARTICIPANT_UNANSWERED_ID })
    orgAdminToken = await generateToken({ userId: ORG_ADMIN_ID })
    studyAdminToken = await generateToken({ userId: STUDY_ADMIN_ID })

    api.run()
  })

  beforeEach(async () => {
    await resetDB()
  })

  afterAll(async () => {
    api.stop()
  })

  describe('GET /audit-logs', () => {
    describe('Authentication and authorisation', () => {
      it('should not allow unauthorised access', async () => {
        const response = await request(app).get('/audit-logs')
        expect(response.status).toBe(401)
      })
      it('should not allow Participants to access', async () => {
        const response = await request(app)
          .get('/audit-logs')
          .set({ Authorization: `Bearer ${participantToken}` })
        expect(response.status).toBe(401)
      })
      it('should allow Organisation Admins to access', async () => {
        const response = await request(app)
          .get('/audit-logs')
          .set({ Authorization: `Bearer ${orgAdminToken}` })
        expect(response.status).toBe(200)
      })
      it('should allow Study Admins to access', async () => {
        const response = await request(app)
          .get('/audit-logs')
          .set({ Authorization: `Bearer ${studyAdminToken}` })
        expect(response.status).toBe(200)
      })
    })

    describe('Default behaviour', () => {
      it('should return default length sorted data and total count when no query params are provided', async () => {
        await seedAuditLogs(55)
        const response = await request(app)
          .get('/audit-logs')
          .set({ Authorization: `Bearer ${studyAdminToken}` })
        expect(response.status).toBe(200)
        const body: GetAuditLogsResponse = response.body
        expect(body).toHaveProperty('data')
        expect(body.data).toHaveLength(defaultAuditLogsPageSize)
        expect(body).toHaveProperty('total')
        expect(body.total).toBe(55)
      })
      it('should handle empty db table gracefully', async () => {
        const response = await request(app)
          .get('/audit-logs')
          .set({ Authorization: `Bearer ${studyAdminToken}` })
        expect(response.status).toBe(200)
        const body: GetAuditLogsResponse = response.body
        expect(body).toHaveProperty('data')
        expect(body.data).toHaveLength(0)
        expect(body).toHaveProperty('total')
        expect(body.total).toBe(0)
      })
      it('should always return accurate total count regardless of _end param', async () => {
        await seedAuditLogs(55)
        const response = await request(app)
          .get(`/audit-logs?_end=${defaultAuditLogsPageSize}`)
          .set({ Authorization: `Bearer ${studyAdminToken}` })
        expect(response.status).toBe(200)
        const body: GetAuditLogsResponse = response.body
        expect(body).toHaveProperty('data')
        expect(body.data).toHaveLength(defaultAuditLogsPageSize)
        expect(body).toHaveProperty('total')
        expect(body.total).toBe(55)
      })
    })

    describe('Pagination', () => {
      it('should accept pagination params and serve correct data', async () => {
        const seedSize = 55
        const start = 5
        const end = 10
        await seedAuditLogs(seedSize)
        const response = await request(app)
          .get(`/audit-logs?_start=${start}&_end=${end}`)
          .set({ Authorization: `Bearer ${studyAdminToken}` })
        expect(response.status).toBe(200)
        const body: GetAuditLogsResponse = response.body
        expect(body).toHaveProperty('data')
        expect(body.data).toHaveLength(end - start)
        expect(body.data[0].id).toBe(1 + start)
        expect(
          body.data[
            start - 1 // account for 0 index
          ].id,
        ).toBe(end)
      })
      it('should handle non-numeric params gracefully', async () => {
        const response = await request(app)
          .get('/audit-logs?_start=foo&_end=bar')
          .set({ Authorization: `Bearer ${studyAdminToken}` })
        expect(response.status).toBe(422)
      })
      it('should handle negative params gracefully', async () => {
        const responseNegativeStart = await request(app)
          .get('/audit-logs?_start=-10&_end=20')
          .set({ Authorization: `Bearer ${studyAdminToken}` })
        expect(responseNegativeStart.status).toBe(422)
        const responseNegativeEnd = await request(app)
          .get('/audit-logs?_start=10&_end=-20')
          .set({ Authorization: `Bearer ${studyAdminToken}` })
        expect(responseNegativeEnd.status).toBe(422)
      })
      it('should handle reversed bounds (_end < _start) gracefully', async () => {
        const response = await request(app)
          .get('/audit-logs?_start=30&_end=10')
          .set({ Authorization: `Bearer ${studyAdminToken}` })
        expect(response.status).toBe(422)
      })
      it('should return an empty array if _start is greater than total number of records', async () => {
        const seedSize = 5
        await seedAuditLogs(seedSize)
        const response = await request(app)
          .get('/audit-logs?_start=50&_end=100')
          .set({ Authorization: `Bearer ${studyAdminToken}` })
        expect(response.status).toBe(200)
        const body: GetAuditLogsResponse = response.body
        expect(body).toHaveProperty('data')
        expect(body.data).toHaveLength(0)
        expect(body).toHaveProperty('total')
        expect(body.total).toBe(seedSize)
      })
    })

    describe('Sorting', () => {
      it('should accept sortDirection asc', async () => {
        const seedSize = 5
        await seedAuditLogs(seedSize)
        const response = await request(app)
          .get('/audit-logs?sortBy=id&sortDirection=asc')
          .set({ Authorization: `Bearer ${studyAdminToken}` })
        expect(response.status).toBe(200)
        const body: GetAuditLogsResponse = response.body
        expect(body).toHaveProperty('data')
        expect(body.data[0].id).toBe(1)
      })
      it('should accept sortDirection desc', async () => {
        const seedSize = 5
        await seedAuditLogs(seedSize)
        const response = await request(app)
          .get('/audit-logs?sortBy=id&sortDirection=desc')
          .set({ Authorization: `Bearer ${studyAdminToken}` })
        expect(response.status).toBe(200)
        const body: GetAuditLogsResponse = response.body
        expect(body).toHaveProperty('data')
        expect(body.data[0].id).toBe(seedSize)
      })
      it('should accept sorting params and handle errors (incorrect field)', async () => {
        const seedSize = 5
        await seedAuditLogs(seedSize)
        const response = await request(app)
          .get('/audit-logs?sortBy=totallyFakeField')
          .set({ Authorization: `Bearer ${studyAdminToken}` })
        expect(response.status).toBe(422)
      })
    })

    describe('Param combinations', () => {
      it('should accept combinations of sorting and pagination params and apply them', async () => {
        const seedSize = 55
        const start = 5
        const end = 10
        await seedAuditLogs(seedSize)
        const response = await request(app)
          .get(`/audit-logs?_start=${start}&_end=${end}&sortBy=id&sortDirection=desc`)
          .set({ Authorization: `Bearer ${studyAdminToken}` })
        expect(response.status).toBe(200)
        const body: GetAuditLogsResponse = response.body
        expect(body).toHaveProperty('data')
        expect(body.data).toHaveLength(end - start)
        expect(body.data[0].id).toBe(seedSize - start)
        expect(
          body.data[
            start - 1 // account for 0 index
          ].id,
        ).toBe(seedSize - end + 1) // account for 0 index
      })
    })

    describe('Sensitive information', () => {
      it('should not show sensitive token information in payloads', async () => {
        // Update a redcapToken
        const studyName: string = 'Test Study'
        const testStudyId: number = 1
        // Check test study exists
        const existingStudy = await prisma.study.findFirst({
          where: { name: studyName },
        })

        expect(existingStudy?.name).toBe(studyName)

        const updatedRedcapToken = 'SuperSecretTokenInfo'

        const patchResponse = await request(app)
          .patch(`/studies/${testStudyId}`)
          .set({ Authorization: `Bearer ${orgAdminToken}` })
          .send({ redcapToken: updatedRedcapToken } as UpdateStudyRequest)
        expect(patchResponse.status).toBe(204)

        // Check Audit Logs
        const response = await request(app)
          .get('/audit-logs?sortBy=id&sortDirection=desc')
          .set({ Authorization: `Bearer ${studyAdminToken}` })
        expect(response.status).toBe(200)
        const body: GetAuditLogsResponse = response.body
        expect(body).toHaveProperty('data')
        expect(body.data[0].requestBody).not.toContain(updatedRedcapToken)
      })

      it('should obscure sensitive token information in payloads', async () => {
        // Update a redcapToken
        const studyName: string = 'Test Study'
        const testStudyId: number = 1
        // Check test study exists
        const existingStudy = await prisma.study.findFirst({
          where: { name: studyName },
        })

        expect(existingStudy?.name).toBe(studyName)

        const updatedRedcapToken = 'SuperSecretTokenInfo'
        const obscuredRedcapToken = '\"redcapToken\":\"***\"' // eslint-disable-line no-useless-escape
        const patchResponse = await request(app)
          .patch(`/studies/${testStudyId}`)
          .set({ Authorization: `Bearer ${orgAdminToken}` })
          .send({ redcapToken: updatedRedcapToken } as UpdateStudyRequest)
        expect(patchResponse.status).toBe(204)

        // Check Audit Logs
        const response = await request(app)
          .get('/audit-logs?sortBy=id&sortDirection=desc')
          .set({ Authorization: `Bearer ${studyAdminToken}` })
        expect(response.status).toBe(200)
        const body: GetAuditLogsResponse = response.body
        expect(body).toHaveProperty('data')
        expect(body.data[0].requestBody).toContain(obscuredRedcapToken)
      })

      it('should obscure sensitive password information in payloads', async () => {
        // Register a user
        const registerRequest: RegisterRequest = {
          email: 'johndoe@example.com',
          firstName: 'John',
          lastName: 'Doe',
          password: 'Password1',
          role: Role.Participant,
        }

        const postResponse = await request(app)
          .post('/auth/register')
          .set({ Authorization: `Bearer ${orgAdminToken}` })
          .send(registerRequest)
        expect(postResponse.status).toEqual(201)

        const obscuredPassword = '\"password\":\"***\"' // eslint-disable-line no-useless-escape

        // Check Audit Logs
        const response = await request(app)
          .get('/audit-logs?sortBy=id&sortDirection=desc')
          .set({ Authorization: `Bearer ${studyAdminToken}` })
        expect(response.status).toBe(200)
        const body: GetAuditLogsResponse = response.body
        expect(body).toHaveProperty('data')
        expect(body.data[0].requestBody).toContain(obscuredPassword)
      })
    })
  })
})
