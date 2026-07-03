import request from 'supertest'
import { generateToken } from '../../src/authentication'
import { Api } from '../../src/Api'
import { resetDB } from 'common/testing/TestHelpers'
import { UpdateSurveyAnswersRequest } from 'common/types/api/surveys'
import { CreateStudyRequest } from 'common/types/api/studies'
import { TestUsers } from 'common/testing/constants'
import prisma from '../../src/PrismaClient'

const api = new Api()
const app = api.app
let participantToken: string
let orgAdminToken: string
const STUDY_NAME = 'Soft Deletable Study'
let studyId

describe('Soft Deletion', () => {
  beforeAll(async () => {
    api.run()
    await resetDB()

    participantToken = await generateToken({
      userId: TestUsers.PARTICIPANT_UNANSWERED.id,
    })

    orgAdminToken = await generateToken({
      userId: TestUsers.ORG_ADMIN.id,
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

    await prisma.user.delete({ where: { id: TestUsers.PARTICIPANT_UNANSWERED.id } })
    const user = await prisma.user.findFirst({ where: { id: TestUsers.PARTICIPANT_UNANSWERED.id } })
    expect(user).toBeNull()
  })

  it('Audit log of submitted answer remains', async () => {
    const aLog = await prisma.auditLog.findFirstOrThrow({
      where: { userId: TestUsers.PARTICIPANT_UNANSWERED.id },
    })
    expect(aLog.resource).toBe('studies/survey-answers')
    expect(aLog.operation).toBe('CREATE')
  })

  it('User can be restored', async () => {
    await prisma.user.update({
      where: { deleted: true, id: TestUsers.PARTICIPANT_UNANSWERED.id },
      data: { deleted: false },
    })
    const user = await prisma.user.findFirst({ where: { id: TestUsers.PARTICIPANT_UNANSWERED.id } })
    expect(user).toBeTruthy()
  })

  // Study soft deletion
  it('Study is created, has an associated draft survey, and is subsequently deleted', async () => {
    const reqBody: CreateStudyRequest = { name: `${STUDY_NAME}` }

    await request(app)
      .post('/studies/')
      .set({ authorization: `Bearer ${orgAdminToken}` })
      .send(reqBody)

    studyId = (await prisma.study.findFirstOrThrow({ where: { name: STUDY_NAME } })).id

    await prisma.study.delete({ where: { id: studyId } })
    const study = await prisma.study.findFirst({ where: { id: studyId } })
    expect(study).toBeNull()
  })

  it('Audit log of associated draft survey remains', async () => {
    const aLog = await prisma.auditLog.findFirstOrThrow({
      where: { userId: TestUsers.ORG_ADMIN.id },
    })
    expect(aLog.resource).toBe('studies')
    expect(aLog.operation).toBe('CREATE')
    expect(JSON.parse(aLog.requestBody as any).name).toBe(`${STUDY_NAME}`)
  })

  it('Study can be restored', async () => {
    await prisma.study.update({
      where: { deleted: true, id: studyId },
      data: { deleted: false },
    })
    const study = await prisma.study.findFirst({ where: { name: STUDY_NAME } })
    expect(study).toBeTruthy()
  })
})
