import { CtrlEvent } from '../../prisma/events/event.type'
import Redis from 'ioredis'
import { decryptPayload } from './decryption'

export class Consumer {
  GROUP_NAME = 'BASE_CONSUMER'

  async processEvent(event: CtrlEvent) {
    console.log('Recalc worker processing event', event)
  }

  async consumeLoop(redis: Redis, streamKey: string) {
    while (true) {
      try {
        // prettier-ignore
        const res = await redis.xreadgroup(
        'GROUP', this.GROUP_NAME, `worker-${process.pid}`,
        'COUNT', 10,
        'BLOCK', 1000, 
        'STREAMS', streamKey, '>'
      );

        if (!res) continue

        for (const streamEntry of res) {
          const [_streamName, messages] = streamEntry as any
          for (const message of messages) {
            const [messageId, fieldsArray] = message
            const event = decryptPayload(fieldsArray)
            await this.processEvent(event)
            await redis.xack(streamKey, this.GROUP_NAME, messageId)
          }
        }
      } catch (err) {
        console.error('Error in consumer loop:', err)
        await new Promise((r) => setTimeout(r, 1000)) // backoff
      }
    }
  }
}
