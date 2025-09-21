import {
  publishNewVersion,
  resetDB,
  readDir,
  getLatestFile,
  readPdf,
  deleteFile,
  updateLogo,
  getInviteId,
  inviteUser,
  removeUserFromStudy,
} from 'common/testing/TestHelpers'
import { formatStudyName } from 'common/src/pdfHelpers'

import {
  PASSWORD_RESET_USER_EMAIL,
  TEST_STUDY,
  TEST_STUDY_ID,
  FE_TEST_STUDY,
  FE_TEST_STUDY_ID,
} from 'common/testing/seed'
import { defineConfig } from 'cypress'

export default defineConfig({
  env: {
    DATABASE_URL: 'postgres://postgres:password@db-test:5432/ctrl',
    PASSWORD_RESET_USER_EMAIL: PASSWORD_RESET_USER_EMAIL,
    TEST_STUDY: TEST_STUDY,
    TEST_STUDY_ID: TEST_STUDY_ID,
    FE_TEST_STUDY: FE_TEST_STUDY,
    FE_TEST_STUDY_ID: FE_TEST_STUDY_ID,
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
        updateLogo(filePath: string) {
          return updateLogo(filePath)
        },
        getInviteIdtask({ email, studyId }) {
          return getInviteId(email, studyId)
        },
        createInvite({ email, studyId }) {
          return inviteUser(email, studyId)
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
