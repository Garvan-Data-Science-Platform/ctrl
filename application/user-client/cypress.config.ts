import {
  publishNewVersion,
  resetDB,
  readDir,
  getLatestFile,
  readPdf,
  deleteFile,
  calculateHash,
  updateLogo,
  getInviteId,
  inviteUser,
  removeUserFromStudy,
} from 'common/testing/TestHelpers'
import { formatStudyName } from 'common/src/utils'

import { defineConfig } from 'cypress'

export default defineConfig({
  retries: 2,
  env: {
    DATABASE_URL: 'postgres://postgres:password@db-test:5432/ctrl',
  },
  e2e: {
    defaultCommandTimeout: 8000,
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
        calculateHash(base64String: string) {
          return calculateHash(base64String)
        },
        updateLogo({ target, filePath, id }) {
          return updateLogo({ target, filePath, id })
        },
        getInviteIdtask({ email, studyId }) {
          return getInviteId(email, studyId)
        },
        createInvite({ email, studyId, prefill }) {
          return inviteUser(email, studyId, prefill)
        },
        removeUserFromStudy({ email, studyId }) {
          return removeUserFromStudy(email, studyId)
        },
        formatStudyName(studyName: string) {
          return formatStudyName(studyName)
        },
      })
    },
  },
})
