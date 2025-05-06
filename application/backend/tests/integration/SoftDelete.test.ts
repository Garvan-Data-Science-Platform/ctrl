import request from 'supertest'
import { generateToken } from '../../src/authentication'
import { Api } from '../../src/Api'
import { resetDB } from 'common/testing/TestHelpers'
import { UpdateSurveyAnswersRequest } from 'common/types/api/surveys'
import { CreateStudyRequest } from 'common/types/api/studies'
import { ORG_ADMIN_ID, PARTICIPANT_UNANSWERED_ID } from 'common/testing/seed'
import prisma from '../../src/PrismaClient'

const api = new Api()
const app = api.app
let participantToken: string
let orgAdminToken: string
const STUDY_NAME = 'Soft Deletable Study'

describe('Soft Deletion', () => {
  beforeAll(async () => {
    api.run()
    await resetDB()

    participantToken = await generateToken({
      userId: PARTICIPANT_UNANSWERED_ID,
      roles: ['Participant'],
    })

    orgAdminToken = await generateToken({
      userId: ORG_ADMIN_ID,
      roles: ['OrganisationAdmin'],
    })
  })

  afterAll(async () => {
    api.stop()
  })

  it('User submits answer and is subsequently deleted', async () => {
    const reqBody: UpdateSurveyAnswersRequest = { step: 0, data: [false, 'Choice 1b'] }

    await request(app)
      .post('/studies/1/survey-answers')
      .set({ authorization: `Bearer ${participantToken}` })
      .send(reqBody)

    await prisma.user.delete({ where: { id: PARTICIPANT_UNANSWERED_ID } })
    const user = await prisma.user.findFirst({ where: { id: PARTICIPANT_UNANSWERED_ID } })
    expect(user).toBeNull()
  })

  it('Audit log of submitted answer remains', async () => {
    const aLog = await prisma.auditLog.findFirstOrThrow({
      where: { userId: PARTICIPANT_UNANSWERED_ID },
    })
    expect(aLog.resource).toBe('studies/survey-answers')
    expect(aLog.operation).toBe('UPDATE')
  })

  it('User can be restored', async () => {
    await prisma.user.update({
      where: { deleted: true, id: PARTICIPANT_UNANSWERED_ID },
      data: { deleted: false },
    })
    const user = await prisma.user.findFirst({ where: { id: PARTICIPANT_UNANSWERED_ID } })
    expect(user).toBeTruthy()
  })

  // Study soft deletion
  it('Study is created, has an associated draft survey, and is subsequently deleted', async () => {
    const reqBody: CreateStudyRequest = { name: `${STUDY_NAME}` }

    await request(app)
      .post('/studies/')
      .set({ authorization: `Bearer ${orgAdminToken}` })
      .send(reqBody)

    await prisma.study.delete({ where: { name: STUDY_NAME } })
    const study = await prisma.study.findFirst({ where: { name: STUDY_NAME } })
    expect(study).toBeNull()
  })

  it('Audit log of associated draft survey remains', async () => {
    const aLog = await prisma.auditLog.findFirstOrThrow({ where: { userId: ORG_ADMIN_ID } })
    expect(aLog.resource).toBe('studies')
    expect(aLog.operation).toBe('UPDATE')
    expect((aLog.meta as any).bodyData.name).toBe(`${STUDY_NAME}`)
  })

  it('Study can be restored', async () => {
    await prisma.study.update({
      where: { deleted: true, name: STUDY_NAME },
      data: { deleted: false },
    })
    const study = await prisma.study.findFirst({ where: { name: STUDY_NAME } })
    expect(study).toBeTruthy()
  })
})
