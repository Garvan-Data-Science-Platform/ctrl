import { CtrlEvent } from '../../prisma/events/event.type'
import { Consumer } from './BaseConsumer'
import prisma from '../../src/PrismaClient'
import { recalculateAnswers } from '../../src/utils/answers'

export class RecalcConsumer extends Consumer {
  GROUP_NAME = 'RECALC'

  async processEvent(event: CtrlEvent) {
    console.log('Recalc worker processing event', event)

    switch (event.eventType) {
      case 'answers.updated': {
        const { userId, studyId } = event.payload
        const profile = await prisma.participantProfile.findFirstOrThrow({ where: { userId } })
        if (profile.participantType == 'GUARDIAN') {
          console.log('Guardian answers updated, calculating dependant answers')
          await recalculateAnswers(profile.familyId, studyId)
        }
        break
      }

      case 'family.updated': {
        console.log('Family updated, recalculating dependant answers')
        const studies = await prisma.study.findMany({
          where: {
            profiles: {
              some: { deleted: false, participantProfile: { familyId: event.payload.familyId } },
            },
          },
        })

        for (const study of studies) {
          await recalculateAnswers(event.payload.familyId, study.id)
        }

        break
      }

      case 'profile.updated': {
        if (event.payload.fields.participantType) {
          console.log('ParticipantType updated, recalculating dependant answers')
          const profile = await prisma.participantProfile.findFirstOrThrow({
            where: { id: event.payload.profileId },
          })
          const updatedStudies = await prisma.study.findMany({
            where: {
              profiles: {
                some: {
                  participantProfile: {
                    familyId: profile.familyId,
                  },
                },
              },
            },
            select: {
              id: true,
              name: true,
            },
          })

          if (updatedStudies.length === 0) return

          for (const study of updatedStudies) {
            await recalculateAnswers(profile.familyId, study.id)
          }
        }

        break
      }

      case 'study.participant.removed': {
        const profile = await prisma.participantProfile.findFirstOrThrow({
          where: { id: event.payload.profileId },
          select: { familyId: true },
        })
        await recalculateAnswers(profile.familyId, event.payload.studyId)

        break
      }

      case 'study.participant.added': {
        const profile = await prisma.participantProfile.findFirstOrThrow({
          where: { id: event.payload.profileId },
          select: { familyId: true },
        })
        await recalculateAnswers(profile.familyId, event.payload.studyId)

        break
      }
      default:
        break
    }
  }
}
