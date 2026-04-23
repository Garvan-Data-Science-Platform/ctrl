import request from 'supertest'
import { Api } from '../Api'
// import prisma from '../PrismaClient'
import { resetDB, seedAuditLogs } from 'common/testing/TestHelpers'
import { generateToken } from '../authentication'
import type { GetAuditLogsResponse } from 'common/types/api/audit-logs'
// import type { RegisterRequest } from 'common/types/api/auth'
import { ORG_ADMIN_ID, PARTICIPANT_UNANSWERED_ID, STUDY_ADMIN_ID } from 'common/testing/seed'
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
    // it('should return a list of users', async () => {
    //   const response = await request(app).get('/users')
    //   // .set({ Authorization: `Bearer ${orgAdminToken}` })
    //   expect(response.status).toBe(200)

    //   // const body: GetAllUsersResponse = response.body
    //   // expect(body).toHaveProperty('data')
    //   // expect(body.data).toHaveLength(8)
    // })

    // it('should return a 500 error if a database error occurs', async () => {
    //   jest.spyOn(prisma.user, 'findMany').mockImplementationOnce(() => {
    //     throw new Error('Internal Server Error')
    //   })
    //   const response = await request(app).get('/users')
    //   // .set({ Authorization: `Bearer ${orgAdminToken}` })

    //   expect(response.status).toBe(500)

    //   // const body: GetAllUsersResponse = response.body
    //   // expect(body.data).toBe(undefined)
    // })

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
        seedAuditLogs(111, 96)
        const response = await request(app)
          .get('/audit-logs')
          .set({ Authorization: `Bearer ${studyAdminToken}` })
        expect(response.status).toBe(200)
        const body: GetAuditLogsResponse = response.body
        expect(body).toHaveProperty('data')
        expect(body.data).toHaveLength(25)
        expect(body).toHaveProperty('total')
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
      it('should always return accurate total count regardles off _end param', async () => {})
    })

    describe('Pagination', () => {
      it('should accept pagination params and serve correct data', async () => {})
      it('should accept pagination params and handle errors (invalid numbers)', async () => {})
      it('shout return an empty array if _start is greater than total number of records', async () => {})
    })

    describe('Soring', () => {
      it('should accept sorting params and serve correct data (note sorting quirks, like caps)', async () => {})
      it('should accept sorting params and handle errors (incorrect field)', async () => {})
    })

    describe('Param combinations', () => {
      it('should accept combinations of sorting and pagination params and apply them', async () => {})
    })
  })
})
