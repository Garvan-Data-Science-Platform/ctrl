import { resetDB } from 'common/testing/TestHelpers'
import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    // eslint-disable-next-line
    setupNodeEvents(on, config) {
      on('task', {
        reset({}) {
          resetDB()
        },
      })
    },
  },
})
