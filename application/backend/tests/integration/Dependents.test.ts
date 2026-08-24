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

import prisma from '../../src/PrismaClient'
import { TestUsers } from 'common/testing/constants'

const api = new Api()
const app = api.app

let adminToken: string

describe('Survey tests', () => {
  beforeAll(async () => {
    api.run()
    await resetDB()
    adminToken = await generateToken({ userId: TestUsers.ORG_ADMIN.id })
  })

  afterAll(async () => {
    api.stop()
  })

  it('Two parents register, with two dependents', async () => {
    const parent1Invite = await prisma.invite.create({
      data: {
        email: 'parent1@gmail.com',
        studyId: 1,
        expiresAt: new Date('2100-01-01'),
        status: 'PENDING',
      },
    })
    const parent2Invite = await prisma.invite.create({
      data: {
        email: 'parent2@gmail.com',
        studyId: 1,
        expiresAt: new Date('2100-01-01'),
        status: 'PENDING',
      },
    })

    const reqBody: RegisterParticipantRequest = {
      addressLine: 'abc',
      dob: '1990-01-01',
      email: 'parent1@gmail.com',
      firstName: 'J',
      lastName: 'K',
      mobile: '0412345678',
      nextOfKin: { email: 'nok@gmail.com', firstName: 'N', lastName: 'k' },
      participantType: ParticipantType.STANDARD,
      password: TestUsers.PARTICIPANT_COMPLETED.password, // Using test user pw to meet pw requirements
      postcode: '1234',
      preferredContact: ContactMethod.MOBILE,
      state: StateTerritory.ACT,
      suburb: 'ABCKDF',
      dependents: [
        { firstName: 'ChildA', lastName: 'K', dob: '2020-01-01', permanent: true },
        { firstName: 'ChildB', lastName: 'K', dob: '2020-01-02', permanent: false },
      ],
    }
    const reqBody2 = { ...reqBody, email: 'parent2@gmail.com', firstName: 'X' }

    let regRes = await request(app)
      .post(`/auth/register/participants/${parent1Invite.id}`)
      .send(reqBody)
    expect(regRes.statusCode).toBe(201)
    regRes = await request(app)
      .post(`/auth/register/participants/${parent2Invite.id}`)
      .send(reqBody2)
    expect(regRes.statusCode).toBe(201)

    const deps1 = await prisma.participantProfile.findMany({ where: { firstName: 'ChildA' } })
    console.log('FAMILY', deps1[0].familyId)
    expect(deps1).toHaveLength(1)
  })

  it('One parent submits answers and both dependents inherit all answers', async () => {
    const p = await prisma.user.findFirstOrThrow({ where: { email: 'parent1@gmail.com' } })
    const p1Token = await generateToken({ userId: p.id })

    const reqBody: UpdateSurveyAnswersRequest = { step: 1, data: [true, 'Choice 1'] }

    const res = await request(app)
      .post('/studies/1/survey-answers')
      .set({ authorization: `Bearer ${p1Token}` })
      .send(reqBody)

    expect(res.statusCode).toBe(204)

    expect(
      (
        await prisma.surveyVersionAnswers.findFirstOrThrow({
          where: { profile: { firstName: 'ChildA' } },
        })
      ).answers[1].answers,
    ).toEqual([true, 'Choice 1'])

    expect(
      (
        await prisma.surveyVersionAnswers.findFirstOrThrow({
          where: { profile: { firstName: 'ChildB' } },
        })
      ).answers[1].answers,
    ).toEqual([true, 'Choice 1'])
  })

  it('Second parent answers with a conflict, and children inherit correct answers', async () => {
    const p2 = await prisma.user.findFirstOrThrow({ where: { email: 'parent2@gmail.com' } })
    const p2Token = await generateToken({ userId: p2.id })

    const reqBody: UpdateSurveyAnswersRequest = { step: 1, data: [false, 'Choice 1'] }

    const res = await request(app)
      .post('/studies/1/survey-answers')
      .set({ authorization: `Bearer ${p2Token}` })
      .send(reqBody)

    expect(res.statusCode).toBe(204)

    expect(
      (
        await prisma.surveyVersionAnswers.findFirstOrThrow({
          where: {
            profile: {
              firstName: 'ChildA',
            },
            version: {
              studyId: 1,
            },
          },
        })
      ).answers[1].answers,
    ).toEqual([null, 'Choice 1'])

    expect(
      (
        await prisma.surveyVersionAnswers.findFirstOrThrow({
          where: { profile: { firstName: 'ChildB' } },
        })
      ).answers[1].answers,
    ).toEqual([null, 'Choice 1'])
  })

  it('Another dependent is registered and inherits the latest answers', async () => {
    await prisma.participantProfile.update({
      where: { id: 98 },
      data: { participantType: 'GUARDIAN' },
    })

    await request(app)
      .post(`/studies/1/families/2/add-dependent`)
      .set({ Authorization: `Bearer ${adminToken}` })
      .send({
        firstName: 'New',
        lastName: 'Dependent',
        dob: '1990-01-02',
        permanent: true,
      })

    const prof = await prisma.participantProfile.findFirstOrThrow({
      where: { firstName: 'New', lastName: 'Dependent' },
    })

    const part = await prisma.surveyVersionAnswers.findFirstOrThrow({
      where: { profileId: prof.id },
    })

    expect(part.answers[1].answers).toEqual([null, 'Choice 1'])
  })

  it('A dependent is moved into this family and inherits the latests answers', async () => {
    await request(app)
      .post(`/studies/1/families/1/add-dependent`)
      .set({ Authorization: `Bearer ${adminToken}` })
      .send({
        firstName: 'New',
        lastName: 'DependentB',
        dob: '1990-01-02',
        permanent: true,
      })

    const prof = await prisma.participantProfile.findFirstOrThrow({
      where: { firstName: 'New', lastName: 'DependentB' },
    })

    let part = await prisma.surveyVersionAnswers.findFirstOrThrow({
      where: { profileId: prof.id },
    })

    expect(part.answers[1].answers).toEqual([null, null])

    await request(app)
      .post(`/studies/1/families/2/add/${prof.id}`)
      .set({ Authorization: `Bearer ${adminToken}` })

    part = await prisma.surveyVersionAnswers.findFirstOrThrow({
      where: { profileId: prof.id },
    })

    expect(part.answers[1].answers).toEqual([null, 'Choice 1'])
  })

  it('Parent is changed to non-guardian, dependents answers are changed to only inherit from remaining parent', async () => {
    const parentProfile = await prisma.participantProfile.findFirstOrThrow({
      where: { user: { email: 'parent2@gmail.com' } },
    })
    const res = await request(app)
      .patch(`/profiles/${parentProfile.id}`)
      .send({ participantType: ParticipantType.STANDARD })
      .set({ Authorization: `Bearer ${adminToken}` })

    expect(res.status).toBe(204)

    const depProfile = await prisma.participantProfile.findFirstOrThrow({
      where: { firstName: 'New', lastName: 'DependentB' },
    })

    let part = await prisma.surveyVersionAnswers.findFirstOrThrow({
      where: { profileId: depProfile.id },
    })

    expect(part.answers[1].answers).toEqual([true, 'Choice 1'])

    //Set back to guardian
    await request(app)
      .patch(`/profiles/${parentProfile.id}`)
      .send({ participantType: ParticipantType.GUARDIAN })
      .set({ Authorization: `Bearer ${adminToken}` })

    part = await prisma.surveyVersionAnswers.findFirstOrThrow({
      where: { profileId: depProfile.id },
    })

    expect(part.answers[1].answers).toEqual([null, 'Choice 1'])
  })

  it('A parent is removed from the family, and the dependents answers are changed to only inherit from remaining parent', async () => {
    const parentProfile = await prisma.participantProfile.findFirstOrThrow({
      where: { user: { email: 'parent2@gmail.com' } },
    })

    await request(app)
      .post(`/studies/1/families/remove/${parentProfile.id}`)
      .set({ Authorization: `Bearer ${adminToken}` })

    const depProfile = await prisma.participantProfile.findFirstOrThrow({
      where: { firstName: 'New', lastName: 'DependentB' },
    })

    const part = await prisma.surveyVersionAnswers.findFirstOrThrow({
      where: { profileId: depProfile.id },
    })

    expect(part.answers[1].answers).toEqual([true, 'Choice 1'])
  })
})
