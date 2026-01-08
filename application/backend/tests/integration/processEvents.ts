import { RecalcConsumer } from '../../events/consumers/RecalcConsumer'
import { CtrlEvent } from '../../prisma/events/event.type'
import prisma from '../../src/PrismaClient'

const consumers = [new RecalcConsumer()]

export async function processEvents() {
  const events = await prisma.outbox.findMany({
    where: { processed: false },
    select: { eventType: true, payload: true },
  })
  for (const event of events) {
    event.payload = JSON.parse(event.payload || '')
    for (const consumer of consumers) {
      await consumer.processEvent(event as unknown as CtrlEvent)
    }
  }
  await prisma.outbox.updateMany({ data: { processed: true } })
}
