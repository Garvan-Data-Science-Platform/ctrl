import {
  expireInvite,
  getInviteId,
  inviteUser,
  partiallyCompleteSurvey,
  resetDB,
  revokeInvite,
  wipeDB,
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
        expireInvite(inviteId: string) {
          return expireInvite(inviteId)
        },
        revokeInvite(inviteId: string) {
          return revokeInvite(inviteId)
        },
        getInviteId({ email, studyId }: { email: string; studyId: number }) {
          return getInviteId(email, studyId)
        },
        createInvite({
          email,
          studyId,
          prefill = {},
        }: {
          email: string
          studyId: number
          prefill?: object
        }) {
          return inviteUser(email, studyId, prefill)
        },
      })
    },
  },
})
