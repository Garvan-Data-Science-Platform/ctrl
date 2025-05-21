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

export async function readDir(directory: string) {
  const fs = await import('fs')
  return fs.readdirSync(directory)
}

export async function getLatestFile(files: string[]) {
  const fs = await import('fs')
  const path = await import('path')

  if (files.length === 0) {
    return null
  }

  const latestFile = files
    .map((file) => ({
      file,
      time: fs.statSync(path.join('cypress/downloads/', file)).mtime.getTime(),
    }))
    .sort((a, b) => b.time - a.time)[0]?.file

  return latestFile || null
}

export async function readPdf(filePath: string): Promise<string> {
  const fs = await import('fs')
  const path = await import('path')
  const pdfParseModule = await import('pdf-parse-new')

  const pdfParse = pdfParseModule.default || pdfParseModule

  return new Promise((resolve) => {
    const resolvedPath = path.resolve(filePath)
    const dataBuffer = fs.readFileSync(resolvedPath)
    pdfParse(dataBuffer).then(function ({ text }) {
      resolve(text)
    })
  })
}

export async function deleteFile(filePath: string) {
  const fs = await import('fs')
  const path = await import('path')
  try {
    const resolvedPath = path.resolve(filePath)
    if (fs.existsSync(resolvedPath)) {
      fs.unlinkSync(resolvedPath)
      return `Deleted: ${filePath}`
    }
    return `File not found: ${filePath}`
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    return `Error deleting file: ${errorMessage}`
  }
}

export async function updateLogo(filePath: string) {
  const fs = await import('fs')
  await prisma.organisation.update({ where: { id: 1 }, data: { logo: fs.readFileSync(filePath) } })
  return null
}
