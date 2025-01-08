import prisma from '../../backend/src/PrismaClient'
import logger from 'common/src/logger'
import { seedTests } from './seed'

// Function to reset DB state
export async function resetDB(): Promise<null> {
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

    // Reset all sequences
    const sequences = await prisma.$queryRaw<
      Array<{ sequencename: string }>
    >`SELECT sequencename FROM pg_sequences WHERE schemaname='public'`

    for (const { sequencename } of sequences) {
      await prisma.$executeRawUnsafe(`ALTER SEQUENCE "public"."${sequencename}" RESTART WITH 1`)
    }

    await seedTests(prisma)
    return null
  } catch (error) {
    logger.error({ error })
    prisma.$disconnect()
    throw error
  }
}
