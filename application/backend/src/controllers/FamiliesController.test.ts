import request from 'supertest'
import { generateToken } from '../authentication'
import { Api } from '../Api'
import { resetDB } from 'common/testing/TestHelpers'
import { TestUsers, TestStudies } from 'common/testing/constants'
import prisma from '../PrismaClient'
import { GetFamilyResponse } from 'common/types/api/families'

const api = new Api()
const app = api.app
const studyId = TestStudies.TEST_STUDY.id

describe('FamiliesController', () => {
  let registeredUserToken: string
  let studyAdminToken: string

  beforeAll(async () => {
    registeredUserToken = await generateToken({
      userId: TestUsers.ORG_ADMIN.id,
    })
    studyAdminToken = await generateToken({
      userId: TestUsers.STUDY_ADMIN.id,
    })
    api.run()
  })

  beforeEach(async () => {
    await resetDB()
  })

  afterAll(async () => {
    api.stop()
  })

  describe('GET /studies/{studyId}/families/{familyId}', () => {
    it('Should return list of family members', async () => {
      const response = await request(app)
        .get(`/studies/${studyId}/families/100`)
        .set({ Authorization: `Bearer ${registeredUserToken}` })
      expect(response.status).toBe(200)
      const body = response.body as GetFamilyResponse
      expect(body.data).toHaveLength(3)
      expect(body.data[0].firstName).toBe('Completed')
    })
    it('Should should return 404 if family not found', async () => {})
  })

  describe('POST /studies/{studyId}/families/remove/{profileId}', () => {
    it('Should remove member from a family and give auto-incremented ID', async () => {
      const response = await request(app)
        .post(`/studies/${studyId}/families/remove/${TestUsers.GUARDIAN_2.id}`)
        .set({ Authorization: `Bearer ${registeredUserToken}` })

      expect(response.status).toBe(204)

      const profile = await prisma.participantProfile.findFirstOrThrow({
        where: { id: TestUsers.GUARDIAN_2.id },
      })
      expect(profile.familyId).toBe(101)

      //No conflict when another family is added
      const newProf = await prisma.participantProfile.create({
        data: { ...profile, individualId: undefined, id: undefined, familyId: undefined },
      })
      expect(newProf.familyId).toBe(102)
    })
    it('Dependent answers should be recalculated on family change', async () => {
      let depSP = await prisma.surveyVersionAnswers.findFirstOrThrow({
        where: { profileId: TestUsers.DEPENDENT.id },
        orderBy: { versionId: 'desc' },
      })

      expect(depSP.answers[1].answers).toEqual([null, null])

      await request(app)
        .post(`/studies/${studyId}/families/remove/${TestUsers.GUARDIAN_2.id}`)
        .set({ Authorization: `Bearer ${registeredUserToken}` })

      depSP = await prisma.surveyVersionAnswers.findFirstOrThrow({
        where: { profileId: TestUsers.DEPENDENT.id },
        orderBy: { versionId: 'desc' },
      })

      expect(depSP.answers[1].answers).toEqual([false, 'Choice 2'])
    })
    it('Study admin can remove from a family that is in multiple studies if they are admin of every study', async () => {
      await prisma.user.update({
        where: { id: TestUsers.STUDY_ADMIN.id },
        data: { adminOfStudies: { connect: { id: TestStudies.FE_TEST_STUDY.id } } },
      })
      const res = await request(app)
        .post(`/studies/${studyId}/families/remove/${TestUsers.GUARDIAN_2.id}`)
        .set({ Authorization: `Bearer ${studyAdminToken}` })
      expect(res.ok).toBe(true)
    })
    it('Study admin can not remove from a family if they are not admin for every study the family appears in', async () => {
      const res = await request(app)
        .post(`/studies/${studyId}/families/remove/${TestUsers.GUARDIAN_2.id}`)
        .set({ Authorization: `Bearer ${studyAdminToken}` })
      expect(res.ok).toBe(false)
    })
  })

  describe('POST /studies/{studyId}/families/:familyId/add/:profileId', () => {
    it('Should move a member into the family', async () => {
      await request(app)
        .post(`/studies/${studyId}/families/100/add/${TestUsers.PARTICIPANT_UNANSWERED.id}`)
        .set({ Authorization: `Bearer ${registeredUserToken}` })

      const newMemberProfile = await prisma.participantProfile.findUniqueOrThrow({
        where: { id: TestUsers.PARTICIPANT_UNANSWERED.id },
      })
      expect(newMemberProfile.familyId).toBe(100)
    })

    it('Dependent answers should be recalculated', async () => {
      let depSP = await prisma.surveyVersionAnswers.findFirstOrThrow({
        where: { profileId: TestUsers.DEPENDENT.id },
        orderBy: { versionId: 'desc' },
      })

      expect(depSP.answers[1].answers).toEqual([null, null])

      await request(app)
        .post(`/studies/${studyId}/families/100/add/${TestUsers.PARTICIPANT_UNANSWERED.id}`)
        .set({ Authorization: `Bearer ${registeredUserToken}` })

      depSP = await prisma.surveyVersionAnswers.findFirstOrThrow({
        where: { profileId: TestUsers.DEPENDENT.id },
        orderBy: { versionId: 'desc' },
      })

      expect(depSP.answers[1].answers).toEqual([false, 'Choice 2'])
    })
    it('Study admin can move from/to a family that is in multiple studies if they are admin of every study', async () => {
      await prisma.user.update({
        where: { id: TestUsers.STUDY_ADMIN.id },
        data: { adminOfStudies: { connect: { id: TestStudies.FE_TEST_STUDY.id } } },
      })
      const res = await request(app)
        .post(`/studies/${studyId}/families/100/add/${TestUsers.PARTICIPANT_UNANSWERED.id}`)
        .set({ Authorization: `Bearer ${studyAdminToken}` })
      expect(res.ok).toBe(true)
    })
    it('Study admin can not move from/to a family if they are not admin for every study the families appears in', async () => {
      const res = await request(app)
        .post(`/studies/${studyId}/families/100/add/${TestUsers.PARTICIPANT_UNANSWERED.id}`)
        .set({ Authorization: `Bearer ${studyAdminToken}` })
      expect(res.ok).toBe(false)
    })
  })

  describe('POST /studies/{studyId}/families/:familyId/add-dependent', () => {
    it('Should add a new dependent to the family', async () => {
      const res = await request(app)
        .post(`/studies/${studyId}/families/100/add-dependent`)
        .set({ Authorization: `Bearer ${registeredUserToken}` })
        .send({
          firstName: 'New',
          lastName: 'Dependent',
          dob: '2020-01-01',
          permanent: false,
        })
      expect(res.status).toBe(204)
      const prof = await prisma.participantProfile.findFirstOrThrow({
        where: { firstName: 'New', lastName: 'Dependent' },
      })
      expect(prof.familyId).toBe(100)
    })
    it('Existing dependent should return error', async () => {
      const res = await request(app)
        .post(`/studies/${studyId}/families/100/add-dependent`)
        .set({ Authorization: `Bearer ${registeredUserToken}` })
        .send({
          firstName: 'Test',
          lastName: 'Dependent',
          dob: '1990-01-23',
          permanent: false,
        })
      expect(res.status).toBe(422)
      expect(res.body.details).toEqual('Dependent already registered in CTRL')
    })
    it('Invalid form should return error', async () => {
      const res = await request(app)
        .post(`/studies/${studyId}/families/100/add-dependent`)
        .set({ Authorization: `Bearer ${registeredUserToken}` })
        .send({
          firstName: 'New',
          lastName: 'Dependent',
          dob: '1990-01-01',
        })
      expect(res.status).toBe(422)
      expect(res.body.details['bodyRequest.permanent']).toBeTruthy()
    })
    it('Dependent answers should be immediately calculated', async () => {
      const res = await request(app)
        .post(`/studies/${studyId}/families/100/add-dependent`)
        .set({ Authorization: `Bearer ${registeredUserToken}` })
        .send({
          firstName: 'New',
          lastName: 'Dependent',
          dob: '1990-01-02',
          permanent: true,
        })
      expect(res.status).toBe(204)

      const prof = await prisma.participantProfile.findFirstOrThrow({
        where: { firstName: 'New', lastName: 'Dependent' },
      })

      const part = await prisma.surveyVersionAnswers.findFirstOrThrow({
        where: { profileId: prof.id },
      })

      expect(part.answers[1].answers).toEqual([false, 'Choice 2'])
    })
  })
})
