import { PrismaClient } from '@prisma/client'
import prisma from '../PrismaClient'

import { createHmac } from 'crypto'

//Generates a unique ID for a study participant
export const genId = async (studyId: number, profileId: number, tx?: PrismaClient) => {
  if (!tx) {
    tx = prisma as PrismaClient
  }
  const last = await tx.studyParticipant.findFirst({
    where: { studyId },
    orderBy: { participantNumber: 'desc' },
  })

  let num = 1

  if (last) {
    num = last.participantNumber + 1
  }

  const participantCode = num.toString(16).padStart(5, '0').toUpperCase()

  const studyString = process.env.HOSTNAME!.concat(String(studyId))

  const studyCode = createHmac('sha256', 'key')
    .update(studyString)
    .digest('base64')
    .replace(/o|O|0|[^\w\s]+/g, '')
    .toUpperCase()
    .slice(0, 3)

  const PID = `PID-${studyCode}-${participantCode}`

  await tx.studyParticipant.update({
    where: { participantProfileId_studyId: { studyId, participantProfileId: profileId } },
    data: { participantNumber: num, participantId: PID },
  })
}

export const genIndId = async (profileId: number, tx?: PrismaClient) => {
  const participantCode = profileId.toString(16).padStart(5, '0').toUpperCase()
  const hostname = process.env.HOSTNAME!
  const instanceString = createHmac('sha256', 'key')
    .update(hostname)
    .digest('base64')
    .replace(/o|O|0|[^\w\s]+/g, '')
    .toUpperCase()
    .slice(0, 3)
  const ID = `IND-${instanceString}-${participantCode}`
  if (!tx) {
    tx = prisma as PrismaClient
  }
  await tx.participantProfile.update({ where: { id: profileId }, data: { individualId: ID } })
}
