import prisma from '../../backend/src/PrismaClient'
import { Prisma, AuditLogOperation } from '@prisma/client'
import { SurveysController } from '../../backend/src/controllers/SurveysController'
import logger from 'common/src/logger'
import { PARTICIPANT_UNANSWERED_ID, seedTests } from './seed'
import { Prefill } from 'common/types/invite'
import { createHash } from 'crypto'
import { processLogoImage } from '../src/imageHelpers'
import fs from 'fs'
import path from 'path'

// Function to reset DB state
export async function resetDB(): Promise<null> {
  try {
    await wipeDB()
    // @ts-ignore
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
  await sc.publishSurvey(
    1, // StudyId
    2, // Survey versionNumber
  )
  return null
}

export async function partiallyCompleteSurvey() {
  const sc = new SurveysController()
  await sc.updateSurveyAnswers(
    { user: { userId: PARTICIPANT_UNANSWERED_ID } },
    1, // StudyId
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

type LogoUpdateOptions =
  | { target: 'organisation'; filePath: string; id?: never }
  | { target: 'study'; filePath: string; id: number }

export async function updateLogo(options: LogoUpdateOptions) {
  const fs = await import('fs')
  const rawBuffer = fs.readFileSync(options.filePath)
  // Process image using the same function the controller uses
  // (This turns the raw >200px image into the standardized 200px PNG)
  const processedBuffer = await processLogoImage(rawBuffer)

  switch (options.target) {
    case 'organisation':
      // Hardcoded ID 1 as we don't support multi-tennant
      await prisma.organisation.update({
        where: { id: 1 },
        data: { logo: processedBuffer },
      })
      break

    case 'study':
      await prisma.study.update({
        where: { id: options.id },
        data: { logo: processedBuffer },
      })
      break
  }
  return null
}

export async function getInviteId(email: string, studyId: number): Promise<string> {
  try {
    const invite = await prisma.invite.findFirstOrThrow({
      where: {
        email: email,
        studyId: studyId,
      },
    })
    return invite.id //String as this is a uuid
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    return `Error finding invite for ${email} in study ${studyId}: ${errorMessage}`
  }
}

export async function inviteUser(email: string, studyId: number, prefill: Prefill) {
  await prisma.invite.create({
    data: {
      email,
      studyId,
      expiresAt: new Date('2100-01-01'),
      status: 'PENDING',
      prefill: JSON.stringify(prefill),
    },
  })
  return null
}

export async function removeUserFromStudy(email: string, studyId: number) {
  const prof = await prisma.participantProfile.findFirstOrThrow({ where: { user: { email } } })
  await prisma.studyParticipant.delete({
    where: { participantProfileId_studyId: { participantProfileId: prof.id, studyId } },
  })
  return null
}

export function calculateHash(base64String: string) {
  return createHash('md5').update(base64String, 'base64').digest('hex')
}

export async function readCommonFile(fileName: string) {
  // Adjust this path based on where 'common' sits relative to your cypress.config.ts
  const filePath = path.resolve(__dirname, '../../common/testing/fixtures', fileName)

  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, 'base64')
  }
  return null
}

export async function expireInvite(inviteId: string) {
  await prisma.invite.update({ where: { id: inviteId }, data: { status: 'EXPIRED' } })
  return null
}

export async function revokeInvite(inviteId: string) {
  await prisma.invite.update({ where: { id: inviteId }, data: { status: 'REVOKED' } })
  return null
}

// Function to generate N audit log entries
export async function seedAuditLogs(count: number) {
  if (count <= 0) return

  const getRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

  const testSeedIdArray = [96, 97, 99, 102, 105, 106] // Array from application/common/testing/seed.ts
  const resources = [
    'studies/surveys/publish',
    'studies/surveys',
    'studies',
    'studies/logo',
    'users',
    'users/make-study-admin',
    'users/remove-study-admin',
    'auth/login',
  ]
  const operations: AuditLogOperation[] = [
    AuditLogOperation.CREATE,
    AuditLogOperation.UPDATE,
    AuditLogOperation.DELETE,
  ]
  const methods = ['POST', 'PATCH', '', 'DELETE']

  const logsToCreate: Prisma.AuditLogCreateManyInput[] = Array.from({ length: count }).map(
    (_, index) => {
      const date = new Date()
      date.setMinutes(date.getMinutes() - index)

      return {
        resource: getRandom(resources),
        operation: getRandom(operations),
        success: true,
        timestamp: date,
        userId: getRandom(testSeedIdArray),
        meta: {
          method: getRandom(methods),
          url: `endpoint/test-${index}`,
        } as Prisma.InputJsonObject,
      }
    },
  )
  await prisma.auditLog.createMany({
    data: logsToCreate,
  })
}
