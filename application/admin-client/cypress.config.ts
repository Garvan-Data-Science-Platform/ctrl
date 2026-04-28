import {
  deleteFile,
  getLatestFile,
  partiallyCompleteSurvey,
  readDir,
  readPdf,
  resetDB,
  wipeDB,
  calculateHash,
  readCommonFile,
  seedAuditLogs,
} from 'common/testing/TestHelpers'
import { defineConfig } from 'cypress'

export default defineConfig({
  retries: 2,
  env: {
    DATABASE_URL: 'postgres://postgres:password@db-test:5432/ctrl',
  },
  e2e: {
    defaultCommandTimeout: 15000,
    baseUrl: 'http://localhost:5003',
    // eslint-disable-next-line
    setupNodeEvents(on, config) {
      on('task', {
        reset() {
          return resetDB()
        },
        partialComplete() {
          return partiallyCompleteSurvey()
        },
        wipe() {
          return wipeDB()
        },
        readDir(directory) {
          return readDir(directory)
        },
        getLatestFile(files: string[]) {
          return getLatestFile(files)
        },
        readPdf(filePath: string) {
          return readPdf(filePath)
        },
        deleteFile(filePath: string) {
          return deleteFile(filePath)
        },
        calculateHash(base64String: string) {
          return calculateHash(base64String)
        },
        readCommonFile(fileName: string) {
          return readCommonFile(fileName)
        },
        async seedAuditLogs(count: number) {
          await seedAuditLogs(count)
          return null
        },
      })
    },
  },
})
