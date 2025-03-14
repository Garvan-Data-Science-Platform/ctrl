import prisma from '../../backend/src/PrismaClient'
import { SurveysController } from '../../backend/src/controllers/SurveysController'
import logger from 'common/src/logger'
import { PARTICIPANT_UNANSWERED_ID, seedTests } from './seed'

// Function to reset DB state
export async function resetDB(): Promise<null> {
  try {
    await wipeDB()
    await seedTests(prisma)
    return null
  } catch (error) {
    logger.error({ error })
    prisma.$disconnect()
    throw error
  }
}

export async function publishNewVersion() {
  const sc = new SurveysController()
  await sc.publishSurvey(2)
  return null
}

export async function partiallyCompleteSurvey() {
  const sc = new SurveysController()
  await sc.updateSurveyAnswers(
    { user: { userId: PARTICIPANT_UNANSWERED_ID } },
    { data: [], step: 0 },
  )
  return null
}

export async function wipeDB() {
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
    return null
  } catch (error) {
    logger.error({ error })
    prisma.$disconnect()
    throw error
  }
}
