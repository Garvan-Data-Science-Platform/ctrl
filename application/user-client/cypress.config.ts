import {
  publishNewVersion,
  resetDB,
  readDir,
  getLatestFile,
  readPdf,
  deleteFile,
  updateLogo,
} from 'common/testing/TestHelpers'
import { PASSWORD_RESET_USER_EMAIL } from 'common/testing/seed'
import { defineConfig } from 'cypress'

export default defineConfig({
  env: {
    DATABASE_URL: 'postgres://postgres:password@db-test:5432/ctrl',
    PASSWORD_RESET_USER_EMAIL: PASSWORD_RESET_USER_EMAIL,
  },
  e2e: {
    baseUrl: 'http://localhost:5002',
    // eslint-disable-next-line
    setupNodeEvents(on, config) {
      on('task', {
        reset() {
          return resetDB()
        },
        publish() {
          return publishNewVersion()
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
        updateLogo(filePath: string) {
          return updateLogo(filePath)
        },
      })
    },
  },
})
