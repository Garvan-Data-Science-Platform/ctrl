import request from 'supertest'
import { generateToken } from '../../src/authentication'
import { Api } from '../../src/Api'
import { resetDB } from 'common/testing/TestHelpers'
import { UpdateSurveyAnswersRequest } from 'common/types/api/surveys'
import { RegisterParticipantRequest } from 'common/types/api/auth'
import {
  ContactMethod,
  ParticipantType,
  StateTerritory,
} from 'common/types/api/users/ParticipantProfile'
import { GetAllStudiesResponse } from 'common/types/api/studies'

import prisma from '../../src/PrismaClient'

import { TEST_STUDY, SECOND_TEST_STUDY } from 'common/testing/seed'

const api = new Api()
const app = api.app

const parent1Email = 'parent1@gmail.com'
const parent2Email = 'parent2@gmail.com'

describe('Studies tests', () => {
  beforeAll(async () => {
    api.run()
    await resetDB()
  })

  afterAll(async () => {
    api.stop()
  })

  it('Two parents register for study 1, with two dependents. None of them appear in study 2', async () => {
    const testStudy = await prisma.study.findFirstOrThrow({
      where: {
        name: TEST_STUDY,
      },
      select: {
        id: true,
      },
    })
    const parent1Invite = await prisma.invite.create({
      data: {
        email: parent1Email,
        studyId: testStudy.id,
        expiresAt: new Date('2100-01-01'),
        status: 'PENDING',
      },
    })
    const parent2Invite = await prisma.invite.create({
      data: {
        email: parent2Email,
        studyId: testStudy.id,
        expiresAt: new Date('2100-01-01'),
        status: 'PENDING',
      },
    })

    const reqBody: RegisterParticipantRequest = {
      addressLine: 'abc',
      dob: '1990-01-01',
      email: parent1Email,
      firstName: 'J',
      lastName: 'K',
      mobile: '0412345678',
      nextOfKin: { email: 'nok@gmail.com', firstName: 'N', lastName: 'k' },
      participantType: ParticipantType.STANDARD,
      password: 'PASS123of2389vNDFS!',
      postcode: '1234',
      preferredContact: ContactMethod.MOBILE,
      state: StateTerritory.ACT,
      suburb: 'ABCKDF',
      dependents: [
        { firstName: 'Child1', lastName: 'K', dob: '2020-01-01', permanent: true },
        { firstName: 'Child2', lastName: 'K', dob: '2020-01-02', permanent: false },
      ],
    }
    const reqBody2 = { ...reqBody, email: parent2Email, firstName: 'X' }

    let regRes = await request(app)
      .post(`/auth/register/participants/${parent1Invite.id}`)
      .send(reqBody)
    expect(regRes.statusCode).toBe(201)
    regRes = await request(app)
      .post(`/auth/register/participants/${parent2Invite.id}`)
      .send(reqBody2)
    expect(regRes.statusCode).toBe(201)

    const deps1 = await prisma.participantProfile.findMany({ where: { firstName: 'Child1' } })
    expect(deps1).toHaveLength(1)

    // Answer a question on survey 1
    const p = await prisma.user.findFirstOrThrow({ where: { email: 'parent1@gmail.com' } })
    const p1Token = await generateToken({ userId: p.id })

    const requestBody: UpdateSurveyAnswersRequest = { step: 1, data: [true, 'Choice 1'] }

    const res = await request(app)
      .post('/studies/1/survey-answers')
      .set({ authorization: `Bearer ${p1Token}` })
      .send(requestBody)

    expect(res.statusCode).toBe(204)

    expect(
      (
        await prisma.surveyVersionAnswers.findFirstOrThrow({
          where: { profile: { firstName: 'Child1' } },
        })
      ).answers[1].answers,
    ).toEqual([true, 'Choice 1'])

    expect(
      (
        await prisma.surveyVersionAnswers.findFirstOrThrow({
          where: { profile: { firstName: 'Child2' } },
        })
      ).answers[1].answers,
    ).toEqual([true, 'Choice 1'])

    const correctStudyParticipants = await prisma.participantProfile.findMany({
      where: {
        OR: [
          { firstName: 'J' },
          { firstName: 'X' },
          { firstName: 'Child1' },
          { firstName: 'Child2' },
        ],
        studies: {
          some: {
            study: {
              name: TEST_STUDY,
            },
          },
        },
      },
    })
    expect(correctStudyParticipants).toHaveLength(4)

    const wrongStudyParticipants = await prisma.participantProfile.findMany({
      where: {
        OR: [
          { firstName: 'J' },
          { firstName: 'X' },
          { firstName: 'Child1' },
          { firstName: 'Child2' },
        ],
        studies: {
          some: {
            study: {
              name: SECOND_TEST_STUDY,
            },
          },
        },
      },
    })
    expect(wrongStudyParticipants).toHaveLength(0)
  })

  it('One of the parents registers for study 2. Study 2 does not show info from the other parent or either dependent', async () => {
    const secondTestStudy = await prisma.study.findFirstOrThrow({
      where: {
        name: SECOND_TEST_STUDY,
      },
      select: {
        id: true,
      },
    })

    const parent1Invite = await prisma.invite.create({
      data: {
        email: parent1Email,
        studyId: secondTestStudy.id,
        expiresAt: new Date('2100-01-01'),
        status: 'PENDING',
      },
    })

    const parent1User = await prisma.user.findUniqueOrThrow({
      where: {
        email: parent1Email,
      },
    })

    // Log in as Parent1
    const token = await generateToken({
      userId: parent1User.id,
    })

    // list pending invites
    const pendingInviteRes = await request(app)
      .get(`/invites/pending`)
      .set({ Authorization: `Bearer ${token}` })
    expect(pendingInviteRes.statusCode).toBe(200)

    const body = pendingInviteRes.body
    expect(body.data.invites).toHaveLength(1)

    // list studies before accepting
    const response = await request(app)
      .get('/studies/list')
      .set({ Authorization: `Bearer ${token}` })
    expect(response.status).toBe(200)

    const studyBody: GetAllStudiesResponse = response.body
    expect(Array.isArray(studyBody.data)).toBeTruthy()
    expect(studyBody.data.length).toEqual(1)

    // accept invites
    const acceptInviteRes = await request(app)
      .post(`/invites/${parent1Invite.id}/accept`)
      .set({ Authorization: `Bearer ${token}` })
    expect(acceptInviteRes.statusCode).toBe(201)

    const correctStudyParticipants = await prisma.participantProfile.findMany({
      where: {
        OR: [
          { firstName: 'J' },
          { firstName: 'X' },
          { firstName: 'Child1' },
          { firstName: 'Child2' },
        ],
        studies: {
          some: {
            study: {
              name: SECOND_TEST_STUDY,
            },
          },
        },
      },
    })
    expect(correctStudyParticipants).toHaveLength(1)

    // list studies after accepting
    const studyListResponse = await request(app)
      .get('/studies/list')
      .set({ Authorization: `Bearer ${token}` })
    expect(studyListResponse.status).toBe(200)

    const studyListBody: GetAllStudiesResponse = studyListResponse.body
    expect(Array.isArray(studyListBody.data)).toBeTruthy()
    expect(studyListBody.data.length).toEqual(2)
  })

  it('Parent is able to view and answer study 2 questions. Dependent answers (in study 1) do not get added or modified', async () => {
    // get dependent answers from study1
    const dep1AnswersBefore = (
      await prisma.surveyVersionAnswers.findFirstOrThrow({
        where: { profile: { firstName: 'Child1' } },
      })
    ).answers[1].last_updated

    // Log in as Parent1
    const parent1User = await prisma.user.findUniqueOrThrow({
      where: {
        email: parent1Email,
      },
    })

    const token = await generateToken({
      userId: parent1User.id,
    })

    // Answer study2 questions
    const secondTestStudy = await prisma.study.findFirstOrThrow({
      where: {
        name: SECOND_TEST_STUDY,
      },
      select: {
        id: true,
      },
    })

    const reqBody: UpdateSurveyAnswersRequest = { step: 0, data: [true] }

    const res = await request(app)
      .post(`/studies/${secondTestStudy.id}/survey-answers`)
      .set({ authorization: `Bearer ${token}` })
      .send(reqBody)
    expect(res.statusCode).toBe(204)
    // get dependent answers. get parent 1 answsers from study1 again
    const dep1AnswersAfter = (
      await prisma.surveyVersionAnswers.findFirstOrThrow({
        where: { profile: { firstName: 'Child1' } },
      })
    ).answers[1].last_updated
    // ensure they are the same
    console.log(`before ${dep1AnswersBefore} \n after: ${dep1AnswersAfter}`)
    expect(dep1AnswersBefore).toBeDefined()
    expect(dep1AnswersAfter).toBeDefined()
    expect(dep1AnswersBefore).toEqual(dep1AnswersAfter)
  })

  it('Second parent is added to study and answers differently to Parent1. Dependent answers (in study 1) do not get modified', async () => {
    const dep1AnswersBefore = (
      await prisma.surveyVersionAnswers.findFirstOrThrow({
        where: { profile: { firstName: 'Child1' } },
      })
    ).answers[1].last_updated

    const secondTestStudy = await prisma.study.findFirstOrThrow({
      where: {
        name: SECOND_TEST_STUDY,
      },
      select: {
        id: true,
      },
    })

    const parent2Invite = await prisma.invite.create({
      data: {
        email: parent2Email,
        studyId: secondTestStudy.id,
        expiresAt: new Date('2100-01-01'),
        status: 'PENDING',
      },
    })

    // Log in as Parent2
    const parent2User = await prisma.user.findUniqueOrThrow({
      where: {
        email: parent2Email,
      },
    })

    const token = await generateToken({
      userId: parent2User.id,
    })

    // Accept invite
    const acceptInviteRes = await request(app)
      .post(`/invites/${parent2Invite.id}/accept`)
      .set({ Authorization: `Bearer ${token}` })
    expect(acceptInviteRes.statusCode).toBe(201)

    // Answer study2 questions
    const reqBody: UpdateSurveyAnswersRequest = { step: 0, data: [false] }

    const res = await request(app)
      .post(`/studies/${secondTestStudy.id}/survey-answers`)
      .set({ authorization: `Bearer ${token}` })
      .send(reqBody)
    expect(res.statusCode).toBe(204)

    // get dependent answers. get parent 1 answsers from study1 again
    const dep1AnswersAfter = (
      await prisma.surveyVersionAnswers.findFirstOrThrow({
        where: { profile: { firstName: 'Child1' } },
      })
    ).answers[1].last_updated
    // ensure they are the same
    console.log(`before ${dep1AnswersBefore} \n after: ${dep1AnswersAfter}`)
    expect(dep1AnswersBefore).toBeDefined()
    expect(dep1AnswersAfter).toBeDefined()
    expect(dep1AnswersBefore).toEqual(dep1AnswersAfter)
  })
  // other integration tests are possible once decision about dependents is made
})
