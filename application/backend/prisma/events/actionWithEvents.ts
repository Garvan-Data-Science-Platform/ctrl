import { PrismaClient, PrismaPromise } from '@prisma/client'
import prisma from '../../src/PrismaClient'
import { CtrlEvent } from './event.type'

export default async function actionWithEvents(
  action: PrismaPromise<any>,
  events: CtrlEvent[],
): Promise<any> {
  const outboxList = events.map((event) =>
    prisma.outbox.create({
      data: {
        eventType: event.eventType,
        payload: JSON.stringify(event.payload),
      },
    }),
  )
  return await prisma.$transaction([action, ...outboxList])
}
