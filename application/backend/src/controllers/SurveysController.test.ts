import request from 'supertest'
import { Api } from '../Api'
import prisma from '../PrismaClient'
import { resetDB } from 'common/testing/TestHelpers'
import { generateToken } from '../authentication'

import {
  GetAllResponsesResponse,
  GetUserSurveyStepResponse,
  GetUserSurveyStepsResponse,
  GetSurveyVersionsResponse,
  UpdateSurveyAnswersRequest,
  UpdateSurveyRequest,
  GetSurveyVersionByVersionNumberResponse,
} from 'common/types/api/surveys'
import {
  DEPENDENT_ID,
  ORG_ADMIN_ID,
  PARTICIPANT_COMPLETED_ID,
  PARTICIPANT_UNANSWERED_ID,
  SECOND_GUARDIAN_ID,
} from 'common/testing/seed'

const api = new Api()
const app = api.app
let token: string, tokenNoAnswers: string, tokenAdmin: string

describe('SurveysController', () => {
  beforeAll(async () => {
    token = await generateToken({ userId: PARTICIPANT_COMPLETED_ID, roles: ['Participant'] })
    tokenNoAnswers = await generateToken({
      userId: PARTICIPANT_UNANSWERED_ID,
      roles: ['Participant'],
    })
    tokenAdmin = await generateToken({ userId: ORG_ADMIN_ID, roles: ['OrganisationAdmin'] })
    api.run()
  })

  beforeEach(async () => {
    await resetDB()
  })

  afterAll(async () => {
    api.stop()
  })
  describe('GET /studies/{studyId}/surveys', () => {
    it('should return all survey versions', async () => {
      const response = await request(app)
        .get('/studies/1/surveys')
        .set({ Authorization: `Bearer ${tokenAdmin}` })
      expect(response.status).toBe(200)
      const body: GetSurveyVersionsResponse = response.body
      // There are two survey versions created in application/common/testing/seed.ts
      expect(body.data.length).toBe(2)
    })
  })

  describe('GET /studies/{studyId}/surveys/published', () => {
    it('should return all published survey versions', async () => {
      const response = await request(app)
        .get('/studies/1/surveys/published')
        .set({ Authorization: `Bearer ${tokenAdmin}` })

      expect(response.status).toBe(200)
      const body: GetSurveyVersionsResponse = response.body
      expect(body.data.length).toBe(1)
      body.data.forEach((survey) => {
        expect(survey.status).toBe('PUBLISHED')
      })
    })
  })

  describe('GET /studies/{studyId}/surveys/{versionNumber}', () => {
    it('should return a survey version', async () => {
      const response = await request(app)
        .get('/studies/1/surveys/1')
        .set({ Authorization: `Bearer ${tokenAdmin}` })
      expect(response.status).toBe(200)
      const body: GetSurveyVersionByVersionNumberResponse = response.body
      expect(body.data.status).toBe('PUBLISHED')
      expect(body.data.data.length).toBeGreaterThan(0)
    })
  })

  describe('GET /surveys/{studyId}/survey-steps/{stepId}', () => {
    it('should return questions and current answers for a survey step', async () => {
      const response = await request(app)
        .get('/studies/1/survey-steps/1')
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
        .get('/studies/1/survey-steps/1')
        .set({ Authorization: `Bearer ${tokenNoAnswers}` })
      expect(response.status).toBe(200)
      const body: GetUserSurveyStepResponse = response.body
      expect(body.data.elements[0].data.value).toBe(null)
    })

    it('should fail if step does not exist', async () => {
      const response = await request(app)
        .get('/studies/1/survey-steps/3')
        .set({ Authorization: `Bearer ${token}` })
      expect(response.status).toBe(422)
    })
  })

  describe('GET /studies/{studyId}/survey-steps', () => {
    it('should get a list of survey steps with state and last updated date for current user', async () => {
      const response = await request(app)
        .get('/studies/1/survey-steps')
        .set({ Authorization: `Bearer ${token}` })
      const body: GetUserSurveyStepsResponse = response.body
      expect(response.status).toBe(200)
      expect(body.data[0].status).toBe('viewed')
      expect(body.data[0].last_updated).toBeUndefined()
      expect(body.data[1].last_updated).toBe('2024-12-02T23:45:27.815Z')
      expect(body.data[1].title).toBe('Step 2')
    })
  })

  describe('POST /studies/{studyId}/survey-answers', () => {
    it('should update survey answers successfully when answers match questions', async () => {
      const reqBody: UpdateSurveyAnswersRequest = {
        step: 1,
        data: [true, 'Choice 1'],
      }
      const response = await request(app)
        .post('/studies/1/survey-answers')
        .set({ Authorization: `Bearer ${token}` })
        .send(reqBody)
      expect(response.status).toBe(204)
      const participant = await prisma.surveyVersionAnswers.findFirst({
        where: {
          profileId: PARTICIPANT_COMPLETED_ID,
          version: {
            studyId: 1,
          },
        },
      })
      expect(participant?.answers[1].answers).toEqual([true, 'Choice 1'])
      const aLog = await prisma.auditLog.findFirstOrThrow({
        where: { userId: PARTICIPANT_COMPLETED_ID },
      })
      expect(aLog.resource).toBe('studies/survey-answers')
      expect(aLog.operation).toBe('UPDATE')
      expect((aLog.meta as any).bodyData).toStrictEqual(reqBody)
    })

    it('should change status from requires_review after submission', async () => {
      let participant = await prisma.surveyVersionAnswers.findUniqueOrThrow({
        where: {
          id: 1,
          version: {
            studyId: 1,
          },
        },
      })
      const answersBefore = participant.answers
      expect(answersBefore[0].status).toBe('review_required')
      const reqBody: UpdateSurveyAnswersRequest = {
        step: 0,
        data: [],
      }
      const response = await request(app)
        .post('/studies/1/survey-answers')
        .set({ Authorization: `Bearer ${tokenNoAnswers}` })
        .send(reqBody)
      expect(response.status).toBe(204)

      participant = await prisma.surveyVersionAnswers.findUniqueOrThrow({
        where: {
          id: 1,
          version: {
            studyId: 1,
          },
        },
      })
      const answersAfter = participant.answers
      expect(answersAfter[0].status).toBe('viewed')
    })
    it('should fail to update answers if they dont match the survey questions', async () => {
      const reqBody: UpdateSurveyAnswersRequest = {
        step: 1,
        data: ['Choic3e', false],
      }
      const response = await request(app)
        .post('/studies/1/survey-answers')
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
        .post('/studies/1/survey-answers')
        .set({ Authorization: `Bearer ${secondGuardianToken}` })
        .send(reqBody)
      expect(response.status).toBe(204)
      const dependentAnswers = await prisma.surveyVersionAnswers.findFirstOrThrow({
        where: {
          profileId: DEPENDENT_ID,
          version: {
            studyId: 1,
          },
        },
      })
      expect(dependentAnswers.answers[1].answers).toEqual([false, null])
    })
  })

  describe('PATCH /studies/{studyId}/surveys/{versionNumber}', () => {
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
        .patch('/studies/1/surveys/2')
        .set({ Authorization: `Bearer ${tokenAdmin}` })
        .send(reqBody)
      expect(response.status).toBe(204)
      const survey = await prisma.surveyVersion.findUniqueOrThrow({
        where: {
          studyId_versionNumber: {
            studyId: 1,
            versionNumber: 2,
          },
        },
      })
      expect(survey?.data[0].elements[1].data.text).toBe('Question 1')

      const aLog = await prisma.auditLog.findFirstOrThrow({
        where: { userId: ORG_ADMIN_ID },
      })
      expect(aLog.resource).toBe('studies/surveys')
      expect(aLog.operation).toBe('UPDATE')
      expect((aLog.meta as any).bodyData).toStrictEqual(reqBody)
      expect((aLog.meta as any).resourceId).toBe('1,2')
    })

    it('should fail to update a published survey', async () => {
      const response = await request(app)
        .patch('/studies/1/surveys/1')
        .set({ Authorization: `Bearer ${tokenAdmin}` })
        .send({ data: [] })
      expect(response.status).toBe(500)
    })
  })

  describe('POST /studies/{studyId}/surveys/{versionNumber}/publish', () => {
    it('should successfully publish a draft survey', async () => {
      const response = await request(app)
        .post('/studies/1/surveys/2/publish')
        .set({ Authorization: `Bearer ${tokenAdmin}` })

      expect(response.status).toBe(204)
      const survey = await prisma.surveyVersion.findUniqueOrThrow({
        where: {
          studyId_versionNumber: {
            studyId: 1,
            versionNumber: 2,
          },
        },
      })
      expect(survey?.status).toBe('PUBLISHED')

      // Check that version number incremented correctly
      const maxSurveyVersion = await prisma.surveyVersion.findFirstOrThrow({
        where: {
          studyId: 1,
        },
        orderBy: [
          {
            versionNumber: 'desc',
          },
        ],
        take: 1,
      })
      expect(maxSurveyVersion.versionNumber).toBe(survey.versionNumber + 1)
    })

    it('should fail to publish an already published survey', async () => {
      const response = await request(app)
        .post('/studies/1/surveys/1/publish')
        .set({ Authorization: `Bearer ${tokenAdmin}` })
      expect(response.status).toBe(500)
    })

    it('should fail to publish an invalid survey', async () => {
      await prisma.surveyVersion.update({
        where: {
          id: 2,
          studyId: 1,
        },
        data: {
          data: [
            {
              title: '',
              text: '',
              elements: [{ type: 'question-choices', data: { text: 'Q1', choices: [] } }],
            },
          ],
        },
      })
      const response = await request(app)
        .post('/studies/1/surveys/2/publish')
        .set({ Authorization: `Bearer ${tokenAdmin}` })
      expect(response.status).toBe(422)
    })
  })
  describe('GET /studies/{studyId}/surveys/{versionNumber}/participants/answers', () => {
    it('Should get a list of all responses', async () => {
      const response = await request(app)
        .get('/studies/1/surveys/1/participants/answers')
        .set({ Authorization: `Bearer ${tokenAdmin}` })

      expect(response.status).toBe(200)

      const data = response.body as GetAllResponsesResponse

      expect(data.data.surveyData[0].text).toBe('This is an introduction video')
      expect(data.data.surveyData).toHaveLength(2)
      expect(data.data.participants).toHaveLength(4)
      expect(data.data.participants[1].profile.firstName).toBe('Completed')
      expect(data.data.participants[1].answers[0].answers).toEqual([])
      expect(data.data.participants[1].answers[1].answers).toEqual([false, 'Choice 2'])
    })
  })
})
