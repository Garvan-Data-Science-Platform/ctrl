import { resetDB } from 'common/testing/TestHelpers'
import { defineConfig } from 'cypress'

export default defineConfig({
  env: {
    DATABASE_URL: 'postgres://postgres:password@db-test:5432/ctrl',
  },
  e2e: {
    baseUrl: 'http://localhost:5173',
    // eslint-disable-next-line
    setupNodeEvents(on, config) {
      on('task', {
        reset() {
          return resetDB()
        },
      })
    },
  },
})
