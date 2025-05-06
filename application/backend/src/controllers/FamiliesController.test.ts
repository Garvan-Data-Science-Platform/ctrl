import request from 'supertest'
import { generateToken } from '../authentication'
import { Api } from '../Api'
import { resetDB } from 'common/testing/TestHelpers'
import {
  DEPENDENT_ID,
  ORG_ADMIN_ID,
  PARTICIPANT_UNANSWERED_ID,
  SECOND_GUARDIAN_ID,
} from 'common/testing/seed'
import prisma from '../PrismaClient'
import { GetFamilyResponse } from 'common/types/api/families'

const api = new Api()
const app = api.app

describe('FamiliesController', () => {
  let registeredUserToken: string

  beforeAll(async () => {
    registeredUserToken = await generateToken({
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

  describe('GET /families/:familyId', () => {
    it('Should return list of family members', async () => {
      const response = await request(app)
        .get('/families/100')
        .set({ Authorization: `Bearer ${registeredUserToken}` })
      expect(response.status).toBe(200)
      const body = response.body as GetFamilyResponse
      expect(body.data).toHaveLength(3)
      expect(body.data[0].firstName).toBe('Completed')
    })
    it('Should should return 404 if family not found', async () => {})
  })

  describe('POST /families/remove/:profileId', () => {
    it('Should remove member from a family and give auto-incremented ID', async () => {
      const response = await request(app)
        .post(`/families/remove/${SECOND_GUARDIAN_ID}`)
        .set({ Authorization: `Bearer ${registeredUserToken}` })

      expect(response.status).toBe(204)

      const profile = await prisma.participantProfile.findFirstOrThrow({
        where: { id: SECOND_GUARDIAN_ID },
      })
      expect(profile.familyId).toBe(101)

      //No conflict when another family is added
      const newProf = await prisma.participantProfile.create({
        data: { ...profile, id: undefined, familyId: undefined },
      })
      expect(newProf.familyId).toBe(102)
    })
    it('Dependent answers should be recalculated on family change', async () => {
      let depSP = await prisma.surveyVersionAnswers.findFirstOrThrow({
        where: { profileId: DEPENDENT_ID },
        orderBy: { versionId: 'desc' },
      })

      expect(depSP.answers[1].answers).toEqual([null, null])

      await request(app)
        .post(`/families/remove/${SECOND_GUARDIAN_ID}`)
        .set({ Authorization: `Bearer ${registeredUserToken}` })

      depSP = await prisma.surveyVersionAnswers.findFirstOrThrow({
        where: { profileId: DEPENDENT_ID },
        orderBy: { versionId: 'desc' },
      })

      expect(depSP.answers[1].answers).toEqual([false, 'Choice 2'])
    })
  })

  describe('POST /families/:familyId/add/:profileId', () => {
    it('Should move a member into the family', async () => {
      await request(app)
        .post(`/families/100/add/${PARTICIPANT_UNANSWERED_ID}`)
        .set({ Authorization: `Bearer ${registeredUserToken}` })

      const newMemberProfile = await prisma.participantProfile.findUniqueOrThrow({
        where: { id: PARTICIPANT_UNANSWERED_ID },
      })
      expect(newMemberProfile.familyId).toBe(100)
    })

    it('Dependent answers should be recalculated', async () => {
      let depSP = await prisma.surveyVersionAnswers.findFirstOrThrow({
        where: { profileId: DEPENDENT_ID },
        orderBy: { versionId: 'desc' },
      })

      expect(depSP.answers[1].answers).toEqual([null, null])

      await request(app)
        .post(`/families/100/add/${PARTICIPANT_UNANSWERED_ID}`)
        .set({ Authorization: `Bearer ${registeredUserToken}` })

      depSP = await prisma.surveyVersionAnswers.findFirstOrThrow({
        where: { profileId: DEPENDENT_ID },
        orderBy: { versionId: 'desc' },
      })

      expect(depSP.answers[1].answers).toEqual([false, 'Choice 2'])
    })
  })

  describe('POST /families/:famliyId/add-dependent', () => {
    it('Should add a new dependent to the family', async () => {
      const res = await request(app)
        .post(`/families/100/add-dependent`)
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
        .post(`/families/100/add-dependent`)
        .set({ Authorization: `Bearer ${registeredUserToken}` })
        .send({
          firstName: 'Test',
          lastName: 'Dependent',
          dob: '1990-01-23',
          permanent: false,
        })
      expect(res.status).toBe(500)
      expect(res.body.details).toEqual('Dependent already registered in CTRL')
    })
    it('Invalid form should return error', async () => {
      const res = await request(app)
        .post(`/families/100/add-dependent`)
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
        .post(`/families/100/add-dependent`)
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
