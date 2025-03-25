import request from 'supertest'
import { generateToken } from '../../src/authentication'
import { Api } from '../../src/Api'
import { resetDB } from 'common/testing/TestHelpers'
import { UpdateSurveyAnswersRequest } from 'common/types/api/surveys'
import { PARTICIPANT_UNANSWERED_ID } from 'common/testing/seed'
import prisma from '../../src/PrismaClient'

const api = new Api()
const app = api.app
let participantToken: string

describe('Soft Deletion', () => {
  beforeAll(async () => {
    api.run()
    await resetDB()

    participantToken = await generateToken({
      userId: PARTICIPANT_UNANSWERED_ID,
      roles: ['Participant'],
    })
  })

  afterAll(async () => {
    api.stop()
  })

  it('User submits answer and is subsequently deleted', async () => {
    const reqBody: UpdateSurveyAnswersRequest = { step: 0, data: [false, 'Choice 1b'] }

    await request(app)
      .post('/surveys/answers/')
      .set({ authorization: `Bearer ${participantToken}` })
      .send(reqBody)

    await prisma.user.delete({ where: { id: PARTICIPANT_UNANSWERED_ID } })
    const user = await prisma.user.findFirst({ where: { id: PARTICIPANT_UNANSWERED_ID } })
    expect(user).toBeNull()
  })

  it('Audit log of submitted answer remains', async () => {
    const aLog = await prisma.auditLog.findFirst({ where: { userId: PARTICIPANT_UNANSWERED_ID } })
    expect(aLog?.resource).toBe('surveys/answers')
    expect(aLog?.operation).toBe('UPDATE')
  })

  it('User can be restored', async () => {
    await prisma.user.update({
      where: { deleted: true, id: PARTICIPANT_UNANSWERED_ID },
      data: { deleted: false },
    })
    const user = await prisma.user.findFirst({ where: { id: PARTICIPANT_UNANSWERED_ID } })
    expect(user).toBeTruthy()
  })
})
