import prisma from '../src/PrismaClient'
import logger from 'common/src/logger'
import { seedTests } from './seed'

// Function to reset DB state
export async function resetDB(): Promise<void> {
  logger.info('Resetting database...')
  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`

  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== '_prisma_migrations')
    .map((name) => `"public"."${name}"`)
    .join(', ')

  try {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`)
    await seedTests(prisma)
    await prisma.$disconnect()
  } catch (error) {
    logger.error({ error })
    prisma.$disconnect()
    throw error
  }
}
