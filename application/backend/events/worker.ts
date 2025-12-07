import express from 'express'
import Redis from 'ioredis'
import prisma from '../src/PrismaClient'

import { RecalcConsumer } from './consumers/RecalcConsumer'
import { Consumer } from './consumers/BaseConsumer'
import { validEventTypes } from '../prisma/events/event.type'

const consumers: Consumer[] = [new RecalcConsumer()]

const PORT = 3000
const STREAM_KEY = 'events'

const redis = new Redis()

const app = express()

let redisConnected = false
let prismaConnected = false

async function checkDeps() {
  try {
    await redis.ping()
    redisConnected = true
  } catch {
    redisConnected = false
  }
  try {
    await prisma.$connect()
    prismaConnected = true
  } catch {
    prismaConnected = false
  }
}

app.get('/healthz', (req, res) => {
  if (!redisConnected || !prismaConnected) {
    return res.status(500).json({ status: 'unhealthy', redisConnected, prismaConnected })
  }
  res.json({ status: 'ok', redisConnected, prismaConnected })
})

app.listen(PORT, () => console.log(`Health server listening on port ${PORT}`))

async function initConsumerGroups() {
  try {
    for (const consumer of consumers) {
      await redis.xgroup('CREATE', STREAM_KEY, consumer.GROUP_NAME, '0', 'MKSTREAM')
      console.log(`Consumer group "${consumer.GROUP_NAME}" created`)
    }
  } catch (err: any) {
    if (!err.message.includes('BUSYGROUP')) console.error(err)
  }
}

async function processOutboxEvents() {
  const BATCH_SIZE = 10
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Lock and fetch a batch of unprocessed events
      const events: any[] = await tx.$queryRaw`
        SELECT * FROM "Outbox"
        WHERE "processed" = false
        ORDER BY "id" ASC
        LIMIT ${BATCH_SIZE}
        FOR UPDATE SKIP LOCKED
      `

      for (const event of events) {
        if (!validEventTypes.includes(event.eventType)) {
          console.error('WARNING. Invalid event type received by worker: ', event.eventType)
        }

        console.log('Received event, sending to redis', event)
        // 2. Send to Redis stream (outside DB transaction, but safe since rows are locked)
        await redis.xadd(
          STREAM_KEY,
          '*',
          'id',
          event.id.toString(),
          'eventType',
          event.eventType,
          'payload',
          event.payload,
        )

        // 3. Mark as processed
        await tx.outbox.update({
          where: { id: event.id },
          data: {
            processed: true,
            processedAt: new Date(),
          },
        })
      }
    })
  } catch (err) {
    console.error('Error processing outbox events:', err)
  }
}

function workerLoop() {
  for (const consumer of consumers) {
    consumer.consumeLoop(redis, STREAM_KEY)
  }
}

async function shutdown() {
  console.log('Shutting down...')
  redis.quit()
  await prisma.$disconnect()
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

const main = async () => {
  await initConsumerGroups()
  setInterval(processOutboxEvents, 1000)
  setInterval(checkDeps, 10000)
  workerLoop()
}
main()
