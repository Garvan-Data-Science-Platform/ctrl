import request from 'supertest'
import { Api } from '../Api'
import prisma from '../PrismaClient'
import {
  GetAllStudiesResponse,
  GetStudyByIdResponse,
  CreateStudyRequest,
  UpdateStudyRequest,
  GetAllStudiesByParticipantResponse,
} from 'common/types/api/studies'
import { TestStudies, TestUsers } from 'common/testing/constants'
import { resetDB, updateLogo } from 'common/testing/TestHelpers'
import logoHashes from '../../../common/testing/fixtures/logo_hashes.json'
import { generateToken } from '../authentication'
import { createHash } from 'crypto'

const fixturesPath = '../common/testing/fixtures/'

const api = new Api()
const app = api.app

describe('StudiesController', () => {
  let orgAdminToken: string
  let studyAdminToken: string

  const testStudyId: number = TestStudies.TEST_STUDY.id
  const testStudyId2: number = TestStudies.TEST_STUDY_2.id

  beforeAll(async () => {
    api.run()
  })

  beforeEach(async () => {
    await resetDB()

    orgAdminToken = await generateToken({ userId: TestUsers.ORG_ADMIN.id })
    studyAdminToken = await generateToken({ userId: TestUsers.STUDY_ADMIN.id })
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
      expect(body.data.length).toEqual(4)
    })

    it('should not return any token information', async () => {
      const response = await request(app)
        .get('/studies')
        .set({ Authorization: `Bearer ${orgAdminToken}` })
      expect(response.status).toBe(200)

      const body: GetAllStudiesResponse = response.body
      expect(Array.isArray(body.data)).toBeTruthy()
      expect(body.data.length).toBeGreaterThan(0)

      body.data.forEach((study) => {
        expect(study).not.toHaveProperty('redcapToken')
      })
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

    it('It should only return studies that study admin is admin of', async () => {
      const response = await request(app)
        .get('/studies')
        .set({ Authorization: `Bearer ${studyAdminToken}` })
      expect(response.status).toBe(200)

      const body: GetAllStudiesResponse = response.body
      expect(Array.isArray(body.data)).toBeTruthy()
      expect(body.data.length).toEqual(1)
    })
  })

  describe('GET /studies/list', () => {
    it('should return a list of studies for logged in user', async () => {
      const token = await generateToken({
        userId: TestUsers.PARTICIPANT_UNANSWERED.id,
      })

      const response = await request(app)
        .get('/studies/list')
        .set({ Authorization: `Bearer ${token}` })
      expect(response.status).toBe(200)

      const body: GetAllStudiesByParticipantResponse = response.body
      expect(Array.isArray(body.data)).toBeTruthy()
      expect(body.data.length).toEqual(2)
    })

    it('should not return any token information', async () => {
      const token = await generateToken({
        userId: TestUsers.PARTICIPANT_UNANSWERED.id,
      })

      const response = await request(app)
        .get('/studies/list')
        .set({ Authorization: `Bearer ${token}` })
      expect(response.status).toBe(200)

      const body: GetAllStudiesByParticipantResponse = response.body
      expect(Array.isArray(body.data)).toBeTruthy()
      expect(body.data.length).toBeGreaterThan(0)

      body.data.forEach((study) => {
        expect(study).not.toHaveProperty('redcapURL')
        expect(study).not.toHaveProperty('redcapToken')
      })
    })

    it('should not return anything for org admin', async () => {
      const response = await request(app)
        .get('/studies/list')
        .set({ Authorization: `Bearer ${orgAdminToken}` })
      expect(response.status).toBe(401)
    })

    it('should return a different list of studies for a different logged in user', async () => {
      const token = await generateToken({
        userId: TestUsers.PARTICIPANT_COMPLETED.id,
      })

      const response = await request(app)
        .get('/studies/list')
        .set({ Authorization: `Bearer ${token}` })
      expect(response.status).toBe(200)

      const body: GetAllStudiesByParticipantResponse = response.body
      expect(Array.isArray(body.data)).toBeTruthy()
      expect(body.data.length).toEqual(1)
    })
  })

  describe('GET /studies/deleted', () => {
    it('should not return any token information', async () => {
      const deleteResponse = await request(app)
        .delete(`/studies/${testStudyId}`)
        .set({ Authorization: `Bearer ${orgAdminToken}` })
      expect(deleteResponse.status).toBe(204)

      const response = await request(app)
        .get('/studies/deleted')
        .set({ Authorization: `Bearer ${orgAdminToken}` })
      expect(response.status).toBe(200)

      const body: GetAllStudiesResponse = response.body
      expect(Array.isArray(body.data)).toBeTruthy()
      expect(body.data.length).toBeGreaterThan(0)

      body.data.forEach((study) => {
        expect(study).not.toHaveProperty('redcapToken') // URL is okay for Admins, just not token
      })
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

    it('should not return any token information to participant', async () => {
      const token = await generateToken({
        userId: TestUsers.PARTICIPANT_UNANSWERED.id,
      })
      const response = await request(app)
        .get(`/studies/${testStudyId}`)
        .set({ Authorization: `Bearer ${token}` })
      expect(response.status).toBe(401)
    })

    it('should not return any token information to admin', async () => {
      const response = await request(app)
        .get(`/studies/${testStudyId}`)
        .set({ Authorization: `Bearer ${orgAdminToken}` })
      expect(response.status).toBe(200)

      const body: GetStudyByIdResponse = response.body
      expect(body.data).not.toBeNull()
      expect(body.data).not.toHaveProperty('redcapToken') // URL is okay but NOT token
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

    it('a study admin creating a study adds them as an admin of that study', async () => {
      const newStudyName = 'Study Admin Test Study'

      const response = await request(app)
        .post('/studies')
        .set({ Authorization: `Bearer ${studyAdminToken}` })
        .send({ name: newStudyName } as CreateStudyRequest)
      expect(response.status).toBe(201)

      // Check study now exists in db
      const createdStudy = await prisma.study.findFirst({
        where: { name: newStudyName },
        select: { name: true, admins: true },
      })
      expect(createdStudy?.name).toBe(newStudyName)
      expect(createdStudy?.admins.map((val) => val.id)).toContain(TestUsers.STUDY_ADMIN.id)
    })

    it('should return an error if the study already exists', async () => {
      const studyNameAlreadyExists = TestStudies.TEST_STUDY.name
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
      const studyName: string = TestStudies.TEST_STUDY.name
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

      expect(response.body.message).toBe(`Study not found`)
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

    it('should not allow deleting last study', async () => {
      await prisma.study.deleteMany({ where: { id: { not: testStudyId } } })

      const response = await request(app)
        .delete(`/studies/${testStudyId}`)
        .set({ Authorization: `Bearer ${orgAdminToken}` })
      expect(response.status).toBe(422)
    })

    it('should allow study admins to delete a study', async () => {
      const response = await request(app)
        .delete(`/studies/${testStudyId}`)
        .set({ Authorization: `Bearer ${studyAdminToken}` })
      expect(response.status).toBe(204)
    })
  })

  describe('GET /studies/:studyId/logo', () => {
    it('should return 404 if no logo has been uploaded', async () => {
      const response = await request(app).get(`/studies/${testStudyId}/logo`).responseType('blob')
      expect(response.status).toBe(404)
    })
    it('should return non-blank logo if logo has been uploaded', async () => {
      await updateLogo({
        target: 'study',
        filePath: `${fixturesPath}/valid_logo.png`,
        id: testStudyId,
      })
      const response = await request(app).get(`/studies/${testStudyId}/logo`).responseType('blob')
      const hash = createHash('md5').update(response.body).digest('hex')
      expect(hash).toEqual(logoHashes.validLogoResizedHash)
      expect(response.status).toBe(200)
    })
  })

  describe('POST /studies/:studyId/logo', () => {
    it('should post a study logo', async () => {
      const response = await request(app)
        .post(`/studies/${testStudyId}/logo`)
        .set({ Authorization: `Bearer ${orgAdminToken}` })
        .attach('file', `${fixturesPath}/valid_logo.png`)
      expect(response.status).toBe(204)
    })

    it('should fail to update invalid logo', async () => {
      const response = await request(app)
        .post(`/studies/${testStudyId}/logo`)
        .set({ Authorization: `Bearer ${orgAdminToken}` })
        .attach('file', `${fixturesPath}/invalid_logo.png`)

      expect(response.status).toBe(422)
    })

    it('should change logo if a logo gets updated', async () => {
      // Post logo
      const originalLogoPostResponse = await request(app)
        .post(`/studies/${testStudyId}/logo`)
        .set({ Authorization: `Bearer ${orgAdminToken}` })
        .attach('file', `${fixturesPath}/valid_logo.png`)
      expect(originalLogoPostResponse.status).toBe(204)
      const originalLogoGetResponse = await request(app)
        .get(`/studies/${testStudyId}/logo`)
        .responseType('blob')
      const originalLogoHash = createHash('md5').update(originalLogoGetResponse.body).digest('hex')
      expect(originalLogoHash).toEqual(logoHashes.validLogoResizedHash)
      expect(originalLogoGetResponse.status).toBe(200)
      // Update logo
      const alternateLogoPostResponse = await request(app)
        .post(`/studies/${testStudyId}/logo`)
        .set({ Authorization: `Bearer ${orgAdminToken}` })
        .attach('file', `${fixturesPath}/alternate_logo.png`)
      expect(alternateLogoPostResponse.status).toBe(204)
      // Test logo has changed
      const alternateLogoGetResponse = await request(app)
        .get(`/studies/${testStudyId}/logo`)
        .responseType('blob')
      const alternateLogoHash = createHash('md5')
        .update(alternateLogoGetResponse.body)
        .digest('hex')
      expect(alternateLogoHash).toEqual(logoHashes.alternateLogoResizedHash)
      expect(alternateLogoGetResponse.status).toBe(200)
    })

    it('should allow a StudyAdmin to update the logo of a study they are part of', async () => {
      // Add a logo to be updated
      const createResponse = await request(app)
        .post(`/studies/${testStudyId}/logo`)
        .set({ Authorization: `Bearer ${orgAdminToken}` })
        .attach('file', `${fixturesPath}/valid_logo.png`)
      expect(createResponse.status).toBe(204)

      // Test update
      const response = await request(app)
        .post(`/studies/${testStudyId}/logo`)
        .set({ Authorization: `Bearer ${studyAdminToken}` })
        .attach('file', `${fixturesPath}/alternate_logo.png`)
      expect(response.status).toBe(204)
    })

    it("shouldn't allow a StudyAdmin to update the logo of a study they are not part of", async () => {
      // Add a logo to be updated
      const createResponse = await request(app)
        .post(`/studies/${testStudyId2}/logo`)
        .set({ Authorization: `Bearer ${orgAdminToken}` })
        .attach('file', `${fixturesPath}/valid_logo.png`)
      expect(createResponse.status).toBe(204)

      // Test update
      const response = await request(app)
        .post(`/studies/${testStudyId2}/logo`)
        .set({ Authorization: `Bearer ${studyAdminToken}` })
        .attach('file', `${fixturesPath}/alternate_logo.png`)
      expect(response.status).toBe(404)
    })
  })

  describe('DELETE /studies/:studyId/logo', () => {
    it('should delete an existing study logo', async () => {
      // Add a logo to be deleted
      const createResponse = await request(app)
        .post(`/studies/${testStudyId}/logo`)
        .set({ Authorization: `Bearer ${orgAdminToken}` })
        .attach('file', `${fixturesPath}/valid_logo.png`)
      expect(createResponse.status).toBe(204)

      // Test deletion
      const response = await request(app)
        .delete(`/studies/${testStudyId}/logo`)
        .set({ Authorization: `Bearer ${orgAdminToken}` })
      expect(response.status).toBe(204)

      // Try to get logo (expecting 404)
      const getResponse = await request(app)
        .get(`/studies/${testStudyId}/logo`)
        .responseType('blob')
      expect(getResponse.status).toBe(404)

      // Verify logo is deleted in db
      const studyWithDeletedLogo = await prisma.study.findFirst({
        where: { id: testStudyId },
      })
      expect(studyWithDeletedLogo?.logo).toBeNull()
    })

    it('should allow study admins to delete a study logo', async () => {
      // Add a logo to be deleted
      const createResponse = await request(app)
        .post(`/studies/${testStudyId}/logo`)
        .set({ Authorization: `Bearer ${studyAdminToken}` })
        .attach('file', `${fixturesPath}/valid_logo.png`)
      expect(createResponse.status).toBe(204)

      // Test deletion
      const response = await request(app)
        .delete(`/studies/${testStudyId}/logo`)
        .set({ Authorization: `Bearer ${studyAdminToken}` })
      expect(response.status).toBe(204)

      // Try to get logo (expecting 404)
      const getResponse = await request(app)
        .get(`/studies/${testStudyId}/logo`)
        .responseType('blob')
      expect(getResponse.status).toBe(404)

      // Verify logo is deleted in db
      const studyWithDeletedLogo = await prisma.study.findFirst({
        where: { id: testStudyId },
      })
      expect(studyWithDeletedLogo?.logo).toBeNull()
    })

    it("shouldn't allow a StudyAdmin to delete the logo of a study they are not part of", async () => {
      // Add a logo to be deleted
      const createResponse = await request(app)
        .post(`/studies/${testStudyId2}/logo`)
        .set({ Authorization: `Bearer ${orgAdminToken}` })
        .attach('file', `${fixturesPath}/valid_logo.png`)
      expect(createResponse.status).toBe(204)

      // Test deletion
      const response = await request(app)
        .delete(`/studies/${testStudyId2}/logo`)
        .set({ Authorization: `Bearer ${studyAdminToken}` })
      expect(response.status).toBe(404)
    })
  })

  describe('PATCH /studies/:studyId/restore', () => {
    it('should restore a deleted study', async () => {
      const studyBeforeDelete = await prisma.study.findFirst({
        where: { id: testStudyId },
      })

      expect(studyBeforeDelete?.deleted).toBe(false)

      // Delete the study
      const deleteResponse = await request(app)
        .delete(`/studies/${testStudyId}`)
        .set({ Authorization: `Bearer ${orgAdminToken}` })
      expect(deleteResponse.status).toBe(204)

      // Verify the study is deleted
      const deletedStudy = await prisma.study.findFirst({
        where: { id: testStudyId, deleted: true },
      })

      expect(deletedStudy?.deleted).toBe(true)

      // Restore the study
      const response = await request(app)
        .patch(`/studies/${testStudyId}/restore`)
        .set({ Authorization: `Bearer ${orgAdminToken}` })
      expect(response.status).toBe(204)

      // Verify the study is restored
      const restoredStudy = await prisma.study.findFirst({
        where: { id: testStudyId },
      })
      expect(restoredStudy?.deleted).toBe(false)
    })

    it('should allow study admins to restore a deleted study', async () => {
      const studyBeforeDelete = await prisma.study.findFirst({
        where: { id: testStudyId },
      })

      expect(studyBeforeDelete?.deleted).toBe(false)

      // Delete the study
      const deleteResponse = await request(app)
        .delete(`/studies/${testStudyId}`)
        .set({ Authorization: `Bearer ${studyAdminToken}` })
      expect(deleteResponse.status).toBe(204)

      // Verify the study is deleted
      const deletedStudy = await prisma.study.findFirst({
        where: { id: testStudyId, deleted: true },
      })

      expect(deletedStudy?.deleted).toBe(true)

      // Restore the study
      const response = await request(app)
        .patch(`/studies/${testStudyId}/restore`)
        .set({ Authorization: `Bearer ${studyAdminToken}` })
      expect(response.status).toBe(204)

      // Verify the study is restored
      const restoredStudy = await prisma.study.findFirst({
        where: { id: testStudyId },
      })
      expect(restoredStudy?.deleted).toBe(false)
    })

    it("shouldn't allow a StudyAdmin to restore a deleted study they are not part of", async () => {
      const studyBeforeDelete = await prisma.study.findFirst({
        where: { id: testStudyId2 },
      })

      expect(studyBeforeDelete?.deleted).toBe(false)

      // Delete the study as OrgAdmin
      const deleteResponse = await request(app)
        .delete(`/studies/${testStudyId2}`)
        .set({ Authorization: `Bearer ${orgAdminToken}` })
      expect(deleteResponse.status).toBe(204)

      // Verify the study is deleted
      const deletedStudy = await prisma.study.findFirst({
        where: { id: testStudyId2, deleted: true },
      })

      expect(deletedStudy?.deleted).toBe(true)

      // Try to restore the study as StudyAdmin
      const response = await request(app)
        .patch(`/studies/${testStudyId2}/restore`)
        .set({ Authorization: `Bearer ${studyAdminToken}` })
      expect(response.status).toBe(404)

      // Verify the study is still deleted
      const restoredStudy = await prisma.study.findFirst({
        where: { id: testStudyId2 },
      })

      const deletedStudy2 = await prisma.study.findFirst({
        where: { id: testStudyId2, deleted: true },
      })

      expect(restoredStudy).toBeNull()
      expect(deletedStudy2?.deleted).toBe(true)
    })
  })
})
