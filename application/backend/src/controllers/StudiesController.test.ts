import request from 'supertest'
import { Api } from '../Api'
import prisma from '../PrismaClient'
import {
  GetAllStudiesResponse,
  GetStudyByIdResponse,
  CreateStudyRequest,
  UpdateStudyRequest,
} from 'common/types/api/studies'
import { PARTICIPANT_UNANSWERED_ID, PARTICIPANT_COMPLETED_ID } from 'common/testing/seed'
import { resetDB } from 'common/testing/TestHelpers'
import { generateToken } from '../authentication'
import { ORG_ADMIN_ID } from 'common/testing/seed'

const api = new Api()
const app = api.app

describe('StudiesController', () => {
  let orgAdminToken: string

  const testStudyId: number = 1

  beforeAll(async () => {
    api.run()
  })

  beforeEach(async () => {
    await resetDB()

    orgAdminToken = await generateToken({ userId: ORG_ADMIN_ID, roles: ['OrganisationAdmin'] })
  })

  afterAll(async () => {
    api.stop()
  })

  describe('GET /studies', () => {
    it('should return a list of studies', async () => {
      const response = await request(app)
        .get('/studies')
        .set({ Authorization: `Bearer ${orgAdminToken}` })
      expect(response.status).toBe(200)

      const body: GetAllStudiesResponse = response.body
      expect(Array.isArray(body.data)).toBeTruthy()
      console.log(body.data)
      expect(body.data.length).toEqual(4)
    })

    it('should return a 500 error if a database error occurs', async () => {
      jest.spyOn(prisma.study, 'findMany').mockImplementationOnce(() => {
        throw new Error('Internal Server Error')
      })
      const response = await request(app)
        .get('/studies')
        .set({ Authorization: `Bearer ${orgAdminToken}` })
      expect(response.status).toBe(500)
    })
  })

  describe('GET /studies/list', () => {
    it('should return a list of studies for logged in user', async () => {
      const token = await generateToken({
        userId: PARTICIPANT_UNANSWERED_ID,
        roles: ['Participant'],
      })

      const response = await request(app)
        .get('/studies/list')
        .set({ Authorization: `Bearer ${token}` })
      expect(response.status).toBe(200)

      const body: GetAllStudiesResponse = response.body
      expect(Array.isArray(body.data)).toBeTruthy()
      expect(body.data.length).toEqual(2)
    })

    it('should not return anything for org admin', async () => {
      const response = await request(app)
        .get('/studies/list')
        .set({ Authorization: `Bearer ${orgAdminToken}` })
      expect(response.status).toBe(401)
    })

    it('should return a different list of studies for a different logged in user', async () => {
      const token = await generateToken({
        userId: PARTICIPANT_COMPLETED_ID,
        roles: ['Participant'],
      })

      const response = await request(app)
        .get('/studies/list')
        .set({ Authorization: `Bearer ${token}` })
      expect(response.status).toBe(200)

      const body: GetAllStudiesResponse = response.body
      expect(Array.isArray(body.data)).toBeTruthy()
      expect(body.data.length).toEqual(1)
    })
  })

  describe('GET /studies/:studyId', () => {
    it('should return an study by ID', async () => {
      const response = await request(app)
        .get(`/studies/${testStudyId}`)
        .set({ Authorization: `Bearer ${orgAdminToken}` })
      expect(response.status).toBe(200)

      const body: GetStudyByIdResponse = response.body
      expect(body.data).not.toBeNull()
      expect(body.data.id).toBe(testStudyId)
    })

    it('should return a 404 error if the study does not exist', async () => {
      const notExistingStudyId: number = 1234567890
      const response = await request(app)
        .get(`/studies/${notExistingStudyId}`)
        .set({ Authorization: `Bearer ${orgAdminToken}` })

      expect(response.status).toBe(404)

      expect(response.body.message).toBe(`Study with ID: ${notExistingStudyId} not found`)
    })

    it('should return a 500 error if a database error occurs', async () => {
      jest.spyOn(prisma.study, 'findUnique').mockImplementationOnce(() => {
        throw new Error('Internal Server Error')
      })
      const response = await request(app)
        .get(`/studies/${testStudyId}`)
        .set({ Authorization: `Bearer ${orgAdminToken}` })
      expect(response.status).toBe(500)
    })
  })

  describe('POST /studies', () => {
    it('should create a new study', async () => {
      const newStudyName = 'New Test Study'

      const response = await request(app)
        .post('/studies')
        .set({ Authorization: `Bearer ${orgAdminToken}` })
        .send({ name: newStudyName } as CreateStudyRequest)
      expect(response.status).toBe(201)

      // Check study now exists in db
      const createdStudy = await prisma.study.findFirst({
        where: { name: newStudyName },
      })
      expect(createdStudy?.name).toBe(newStudyName)
    })

    it('should return an error if the study already exists', async () => {
      const studyNameAlreadyExists = 'Test Study'
      const response = await request(app)
        .post('/studies')
        .set({ Authorization: `Bearer ${orgAdminToken}` })
        .send({ name: studyNameAlreadyExists } as CreateStudyRequest)
      expect(response.status).toBe(500)
    })

    it('should return a 500 error if a database error occurs', async () => {
      jest.spyOn(prisma.study, 'create').mockImplementationOnce(() => {
        throw new Error('Internal Server Error')
      })

      const response = await request(app)
        .post('/studies')
        .set({ Authorization: `Bearer ${orgAdminToken}` })
        .send({ name: 'New Testing Study' } as CreateStudyRequest)

      expect(response.status).toBe(500)

      expect(response.body.message).toBe('Internal Server Error')
    })
  })

  describe('PATCH /studies/:studyId', () => {
    it('should update an existing study', async () => {
      const studyName: string = 'Test Study'
      // Check test study exists
      const existingStudy = await prisma.study.findFirst({
        where: { name: studyName },
      })

      expect(existingStudy?.name).toBe(studyName)

      const updatedStudyName = 'Updated Test Study'

      const response = await request(app)
        .patch(`/studies/${testStudyId}`)
        .set({ Authorization: `Bearer ${orgAdminToken}` })
        .send({ name: updatedStudyName } as UpdateStudyRequest)
      expect(response.status).toBe(204)

      // Check updated study in db
      const updatedStudy = await prisma.study.findFirst({
        where: { id: testStudyId },
      })
      expect(updatedStudy).not.toBeNull()
      expect(updatedStudy?.name).toBe(updatedStudyName)
    })

    it('should return a 404 error if the study is not found', async () => {
      const notExistingStudyId: number = 1234567890
      const response = await request(app)
        .patch(`/studies/${notExistingStudyId}`)
        .set({ Authorization: `Bearer ${orgAdminToken}` })
        .send({ name: 'Updated Test Study' } as UpdateStudyRequest)

      expect(response.status).toBe(404)

      expect(response.body.message).toBe(`Record not found`)
    })
  })

  describe('DELETE /studies/:studyId', () => {
    it('should delete an existing study', async () => {
      const response = await request(app)
        .delete(`/studies/${testStudyId}`)
        .set({ Authorization: `Bearer ${orgAdminToken}` })
      expect(response.status).toBe(204)

      // Check deleted study in db
      const deletedStudy = await prisma.study.findFirst({
        where: { id: testStudyId },
      })
      expect(deletedStudy).toBeNull()
    })

    it('should return a 404 error if the study is not found', async () => {
      const notExistingStudyId: number = 1234567890
      const response = await request(app)
        .delete(`/studies/${notExistingStudyId}`)
        .set({ Authorization: `Bearer ${orgAdminToken}` })

      expect(response.status).toBe(404)

      expect(response.body.message).toBe(`Study with ID: ${notExistingStudyId} not found`)
    })
  })
})
