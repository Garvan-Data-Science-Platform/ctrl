import request from 'supertest'
import { Api } from '../Api'
import prisma from '../PrismaClient'
import { resetDB } from 'common/testing/TestHelpers'
import { generateToken } from '../authentication'

import {
  GetSurveyVersionsResponse,
  GetUserSurveyStepResponse,
  GetUserSurveyStepsResponse,
  UpdateSurveyAnswersRequest,
  UpdateSurveyRequest,
} from 'common/types/api/surveys'
import { GetSurveyVersionByIdResponse } from 'common/types/api/surveys/getSurveyVersionById'
import {
  DEPENDENT_ID,
  ORG_ADMIN_ID,
  PARTICIPANT_COMPLETED_ID,
  PARTICIPANT_UNANSWERED_ID,
  SECOND_GUARDIAN_ID,
} from 'common/testing/seed'

const api = new Api()
const app = api.app
let token: string, tokenNoAnswers: string, tokenNoProfile: string

describe('SurveysController', () => {
  beforeAll(async () => {
    token = await generateToken({ userId: PARTICIPANT_COMPLETED_ID, roles: ['OrganisationAdmin'] })
    tokenNoAnswers = await generateToken({
      userId: PARTICIPANT_UNANSWERED_ID,
      roles: ['OrganisationAdmin'],
    })
    tokenNoProfile = await generateToken({ userId: ORG_ADMIN_ID, roles: ['OrganisationAdmin'] })
    api.run()
  })

  beforeEach(async () => {
    await resetDB()
  })

  afterAll(async () => {
    api.stop()
  })

  describe('GET /surveys', () => {
    it('should return a list of surveys', async () => {
      const response = await request(app)
        .get('/surveys')
        .set({ Authorization: `Bearer ${token}` })
      expect(response.status).toBe(200)

      const body: GetSurveyVersionsResponse = response.body
      expect(body.data[0].status).toBe('DRAFT')
      expect(body.data[1].versionNumber).toBe(1)
    })
  })

  describe('GET /surveys/{surveyId}', () => {
    it('should return a survey version', async () => {
      const response = await request(app)
        .get('/surveys/1')
        .set({ Authorization: `Bearer ${token}` })
      expect(response.status).toBe(200)
      const body: GetSurveyVersionByIdResponse = response.body
      expect(body.data.status).toBe('PUBLISHED')
      expect(body.data.data.length).toBeGreaterThan(0)
    })
  })

  describe('GET /surveys/step/:study/:step', () => {
    it('should return questions and current answers for a survey step', async () => {
      const response = await request(app)
        .get('/surveys/step/1/1')
        .set({ Authorization: `Bearer ${token}` })
      expect(response.status).toBe(200)
      const body: GetUserSurveyStepResponse = response.body
      expect(body.data.current_step).toBe(1)
      expect(body.data.total_steps).toBe(2)
      expect(body.data.elements[0].data.value).toBe(false)
      expect(body.data.elements[3].type).toBe('video')
    })
    it('should return null when the user has not answered yet', async () => {
      const response = await request(app)
        .get('/surveys/step/1/1')
        .set({ Authorization: `Bearer ${tokenNoAnswers}` })
      expect(response.status).toBe(200)
      const body: GetUserSurveyStepResponse = response.body
      expect(body.data.elements[0].data.value).toBe(null)
    })

    it('should fail if step does not exist', async () => {
      const response = await request(app)
        .get('/surveys/step/1/3')
        .set({ Authorization: `Bearer ${token}` })
      expect(response.status).toBe(422)
    })
    it('should fail if user is not assigned to a study', async () => {
      const response = await request(app)
        .get('/surveys/step/1/2')
        .set({ Authorization: `Bearer ${tokenNoProfile}` })
      expect(response.status).toBe(404)
    })
  })

  describe('GET /surveys/steps/:study', () => {
    it('should get a list of survey steps with state and last updated date for current user', async () => {
      const response = await request(app)
        .get('/surveys/steps/1')
        .set({ Authorization: `Bearer ${token}` })
      const body: GetUserSurveyStepsResponse = response.body
      expect(response.status).toBe(200)
      expect(body.data[0].status).toBe('viewed')
      expect(body.data[0].last_updated).toBeUndefined()
      expect(body.data[1].last_updated).toBe('2024-12-02T23:45:27.815Z')
      expect(body.data[1].title).toBe('Step 2')
    })
  })

  describe('POST /surveys/answers', () => {
    it('should update survey answers successfully when answers match questions', async () => {
      const reqBody: UpdateSurveyAnswersRequest = {
        step: 1,
        data: [true, 'Choice 1'],
      }
      const response = await request(app)
        .post('/surveys/answers')
        .set({ Authorization: `Bearer ${token}` })
        .send(reqBody)
      expect(response.status).toBe(204)
      const participant = await prisma.surveyParticipant.findFirst({
        where: { profileId: PARTICIPANT_COMPLETED_ID },
      })
      expect(participant?.answers[1].answers).toEqual([true, 'Choice 1'])
      const aLog = await prisma.auditLog.findFirstOrThrow({
        where: { userId: PARTICIPANT_COMPLETED_ID },
      })
      expect(aLog.resource).toBe('surveys/answers')
      expect(aLog.operation).toBe('UPDATE')
      expect((aLog.meta as any).bodyData).toStrictEqual(reqBody)
    })

    it('should change status from requires_review after submission', async () => {
      let participant = await prisma.surveyParticipant.findUniqueOrThrow({ where: { id: 1 } })
      const answersBefore = participant.answers
      expect(answersBefore[0].status).toBe('review_required')
      const reqBody: UpdateSurveyAnswersRequest = {
        step: 0,
        data: [],
      }
      const response = await request(app)
        .post('/surveys/answers')
        .set({ Authorization: `Bearer ${tokenNoAnswers}` })
        .send(reqBody)
      expect(response.status).toBe(204)

      participant = await prisma.surveyParticipant.findUniqueOrThrow({ where: { id: 1 } })
      const answersAfter = participant.answers
      expect(answersAfter[0].status).toBe('viewed')
    })
    it('should fail to update answers if they dont match the survey questions', async () => {
      const reqBody: UpdateSurveyAnswersRequest = {
        step: 1,
        data: ['Choic3e', false],
      }
      const response = await request(app)
        .post('/surveys/answers')
        .set({ Authorization: `Bearer ${token}` })
        .send(reqBody)
      expect(response.status).toBe(422)
    })

    it('participant should inherit answers from both guardians correctly', async () => {
      const secondGuardianToken = generateToken({
        userId: SECOND_GUARDIAN_ID,
        roles: ['Participant'],
      })

      const reqBody: UpdateSurveyAnswersRequest = {
        step: 1,
        data: [false, 'Choice 1'], //Other parent answer is [false, 'Choice 2']
      }
      const response = await request(app)
        .post('/surveys/answers')
        .set({ Authorization: `Bearer ${secondGuardianToken}` })
        .send(reqBody)
      expect(response.status).toBe(204)
      const dependentAnswers = await prisma.surveyParticipant.findFirstOrThrow({
        where: { profileId: DEPENDENT_ID },
      })
      expect(dependentAnswers.answers[1].answers).toEqual([false, null])
    })
  })

  describe('POST /surveys/participant/{surveyId}', () => {
    it('should add the current user as a survey participant', async () => {
      await prisma.surveyParticipant.deleteMany({})
      const response = await request(app)
        .post('/surveys/participant/1')
        .set({ Authorization: `Bearer ${token}` })
      expect(response.status).toBe(204)
      const participant = await prisma.surveyParticipant.findFirstOrThrow({
        where: { profileId: 99 },
      })
      expect(participant.answers[1].answers[0]).toBe(null)
      const aLog = await prisma.auditLog.findFirstOrThrow({
        where: { userId: 99 },
      })
      expect(aLog.resource).toBe('surveys/participant')
      expect(aLog.operation).toBe('UPDATE')
    })
  })

  describe('PATCH /surveys/{surveyId}', () => {
    it('should successfully update a draft survey', async () => {
      const reqBody: UpdateSurveyRequest = {
        data: [
          {
            text: 'Hello',
            title: 'Title',
            elements: [
              { type: 'subheading', data: { text: 'Subheading text' } },
              { type: 'question-checkbox', data: { text: 'Question 1' } },
            ],
          },
        ],
      }
      const response = await request(app)
        .patch('/surveys/2')
        .set({ Authorization: `Bearer ${token}` })
        .send(reqBody)
      expect(response.status).toBe(204)
      const survey = await prisma.surveyVersion.findFirst({ where: { id: 2 } })
      expect(survey?.data[0].elements[1].data.text).toBe('Question 1')

      const aLog = await prisma.auditLog.findFirstOrThrow({
        where: { userId: PARTICIPANT_COMPLETED_ID },
      })
      expect(aLog.resource).toBe('surveys')
      expect(aLog.operation).toBe('UPDATE')
      expect((aLog.meta as any).bodyData).toStrictEqual(reqBody)
      expect((aLog.meta as any).resourceId).toBe('2')
    })

    it('should fail to update a published survey', async () => {
      const response = await request(app)
        .patch('/surveys/1')
        .set({ Authorization: `Bearer ${token}` })
        .send({ data: [] })
      expect(response.status).toBe(500)
    })
  })

  describe('POST /surveys/publish/{surveyId}', () => {
    it('should successfully publish a draft survey', async () => {
      const response = await request(app)
        .post('/surveys/publish/2')
        .set({ Authorization: `Bearer ${token}` })

      expect(response.status).toBe(204)
      const survey = await prisma.surveyVersion.findFirst({ where: { id: 2 } })
      expect(survey?.status).toBe('PUBLISHED')
    })

    it('should fail to publish an already published survey', async () => {
      const response = await request(app)
        .post('/surveys/publish/1')
        .set({ Authorization: `Bearer ${token}` })
      expect(response.status).toBe(500)
    })
  })
})
