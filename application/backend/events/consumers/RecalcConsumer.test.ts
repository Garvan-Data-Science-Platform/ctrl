import request from 'supertest'
import {
  DEPENDENT_ID,
  ORG_ADMIN_ID,
  PARTICIPANT_COMPLETED_ID,
  PARTICIPANT_UNANSWERED_ID,
  SECOND_GUARDIAN_ID,
} from 'common/testing/seed'
import { Api } from '../../src/Api'
import { resetDB } from 'common/testing/TestHelpers'
import prisma from '../../src/PrismaClient'
import { generateToken } from '../../src/authentication'
import { RecalcConsumer } from './RecalcConsumer'
import { CtrlEvent } from '../../prisma/events/event.type'
import { FamiliesController } from '../../src/controllers/FamiliesController'
import { ProfilesController } from '../../src/controllers/ProfilesController'
import { ParticipantType } from 'common/types/api/users/ParticipantProfile'
import { ParticipantsController } from '../../src/controllers/ParticipantsController'
const api = new Api()
const app = api.app
const studyId = 1

const recalcConsumer = new RecalcConsumer()

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

  async function processAllEvents() {
    const events = await prisma.outbox.findMany({
      where: { processed: false },
      select: { eventType: true, payload: true },
    })
    for (const event of events) {
      event.payload = JSON.parse(event.payload || '')
      await recalcConsumer.processEvent(event as unknown as CtrlEvent)
    }
    await prisma.outbox.updateMany({ data: { processed: true } })
  }

  it('Recalculate on removing a family member', async () => {
    let depSP = await prisma.surveyVersionAnswers.findFirstOrThrow({
      where: { profileId: DEPENDENT_ID },
      orderBy: { versionId: 'desc' },
    })

    expect(depSP.answers[1].answers).toEqual([null, null])

    await new FamiliesController().removeMember(studyId, SECOND_GUARDIAN_ID)

    await processAllEvents()

    depSP = await prisma.surveyVersionAnswers.findFirstOrThrow({
      where: { profileId: DEPENDENT_ID },
      orderBy: { versionId: 'desc' },
    })

    expect(depSP.answers[1].answers).toEqual([false, 'Choice 2'])
  })

  it('Recalc on adding new dependant', async () => {
    const body = {
      firstName: 'New',
      lastName: 'Dependent',
      dob: '1990-01-02',
      permanent: true,
    }

    await new FamiliesController().addNewDependent(studyId, 100, body)

    await processAllEvents()

    const prof = await prisma.participantProfile.findFirstOrThrow({
      where: { firstName: 'New', lastName: 'Dependent' },
    })

    const part = await prisma.surveyVersionAnswers.findFirstOrThrow({
      where: { profileId: prof.id },
    })

    expect(part.answers[1].answers).toEqual([false, 'Choice 2'])
  })

  it('Recalculate on moving member to a new family', async () => {
    let depSP = await prisma.surveyVersionAnswers.findFirstOrThrow({
      where: { profileId: DEPENDENT_ID },
      orderBy: { versionId: 'desc' },
    })

    expect(depSP.answers[1].answers).toEqual([null, null])

    await new FamiliesController().addExistingMember(studyId, 100, PARTICIPANT_UNANSWERED_ID)

    await processAllEvents()

    depSP = await prisma.surveyVersionAnswers.findFirstOrThrow({
      where: { profileId: DEPENDENT_ID },
      orderBy: { versionId: 'desc' },
    })

    expect(depSP.answers[1].answers).toEqual([false, 'Choice 2'])
  })

  it('Recalculate on changing family member to/from GUARDIAN', async () => {
    await new ProfilesController().updateProfileById(PARTICIPANT_COMPLETED_ID, {
      participantType: ParticipantType.STANDARD,
    })

    await processAllEvents()

    let depSP = await prisma.surveyVersionAnswers.findFirstOrThrow({
      where: { profileId: DEPENDENT_ID },
      orderBy: { versionId: 'desc' },
    })

    expect(depSP.answers[1].answers).toEqual([null, null])

    await new ProfilesController().updateProfileById(PARTICIPANT_COMPLETED_ID, {
      participantType: ParticipantType.GUARDIAN,
    })

    await processAllEvents()

    let depSP2 = await prisma.surveyVersionAnswers.findFirstOrThrow({
      where: { profileId: DEPENDENT_ID },
      orderBy: { versionId: 'desc' },
    })

    expect(depSP2.answers[1].answers).toEqual([false, 'Choice 2'])
  })

  it('Recalculate on removing as study participant', async () => {
    let depSP = await prisma.surveyVersionAnswers.findFirstOrThrow({
      where: { profileId: DEPENDENT_ID },
      orderBy: { versionId: 'desc' },
    })
    expect(depSP.answers[1].answers).toEqual([null, null])

    await new ParticipantsController().deleteParticipantById(studyId, SECOND_GUARDIAN_ID)

    await processAllEvents()

    let depSP2 = await prisma.surveyVersionAnswers.findFirstOrThrow({
      where: { profileId: DEPENDENT_ID },
      orderBy: { versionId: 'desc' },
    })

    expect(depSP2.answers[1].answers).toEqual([false, 'Choice 2'])
  })

  it('Recalculate on adding as study participant', async () => {
    await new ParticipantsController().deleteParticipantById(studyId, PARTICIPANT_COMPLETED_ID)
    await processAllEvents()
    let depSP = await prisma.surveyVersionAnswers.findFirstOrThrow({
      where: { profileId: DEPENDENT_ID },
      orderBy: { versionId: 'desc' },
    })
    expect(depSP.answers[1].answers).toEqual([null, null])
    await new ParticipantsController().addParticipantById(studyId, PARTICIPANT_COMPLETED_ID)
    await processAllEvents()
    let depSP2 = await prisma.surveyVersionAnswers.findFirstOrThrow({
      where: { profileId: DEPENDENT_ID },
      orderBy: { versionId: 'desc' },
    })

    expect(depSP2.answers[1].answers).toEqual([false, 'Choice 2'])
  })

  it('Recalculate on guardian submitting answers', () => {})
})
