import { PrismaClient } from '@prisma/client'
import prisma from '../../src/PrismaClient'
import { CtrlEvent } from './event.type'

// Helper types
type MethodArgs<
  M extends keyof PrismaClient,
  K extends 'update' | 'updateMany' | 'deleteMany' | 'create',
> = PrismaClient[M] extends { [P in K]: (args: infer A) => Promise<any> } ? A : never

type MethodReturn<
  M extends keyof PrismaClient,
  K extends 'update' | 'updateMany' | 'deleteMany' | 'create',
> = PrismaClient[M] extends { [P in K]: (args: any) => Promise<infer R> } ? R : never

// Generic function
export default async function actionWithEvents<
  M extends keyof PrismaClient,
  K extends 'update' | 'updateMany' | 'deleteMany' | 'create',
>(
  modelName: M,
  method: K,
  params: MethodArgs<M, K>,
  events: CtrlEvent[],
): Promise<MethodReturn<M, K>> {
  return await prisma.$transaction(async (tx) => {
    // @ts-expect-error
    const result = await tx[modelName][method](params)
    for (const event of events) {
      await tx.outbox.create({
        data: {
          eventType: event.eventType,
          payload: JSON.stringify(event.payload),
        },
      })
    }

    return result
  })
}
