import prisma from 'PrismaClient'

import { createHmac } from 'crypto'

//Generates a unique ID for a study participant
export const genId = async (studyId: number, profileId: number) => {
  const last = await prisma.studyParticipant.findFirst({
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

  await prisma.studyParticipant.update({
    where: { participantProfileId_studyId: { studyId, participantProfileId: profileId } },
    data: { participantNumber: num, participantId: PID },
  })
}
