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

// MailHog API helpers
const MAILHOG_API = 'http://localhost:8025/api/v2'

async function getMailhogEmails() {
  const response = await fetch(`${MAILHOG_API}/messages`)
  const data = await response.json()
  console.log(data)
  return data.items || []
}

async function getEmailsForRecipient(email: string) {
  const emails = await getMailhogEmails()
  return emails.filter((msg: any) =>
    msg.Content.Headers.To?.some((to: string) => to.includes(email)),
  )
}

async function clearMailhogEmails() {
  await fetch('http://localhost:8025/api/v1/messages', { method: 'DELETE' })
  return null
}

async function getRegistrationLinkFromEmail(email: string) {
  const emails = await getEmailsForRecipient(email)
  if (emails.length === 0) {
    throw new Error(`No emails found for ${email}`)
  }
  const latestEmail = emails[0]
  const body = latestEmail.Content.Body
  // Extract registration link (format: /register/{inviteId})
  const match = body.match(/register\/([a-f0-9-]+)/i)
  if (!match) {
    throw new Error(`No registration link found in email body`)
  }
  return match[1] // Returns the inviteId
}

export default defineConfig({
  retries: 2,
  env: {
    DATABASE_URL: 'postgres://postgres:password@db-test:5432/ctrl',
    MAILHOG_URL: 'http://localhost:8025',
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
        // MailHog email tasks
        getEmails() {
          return getMailhogEmails()
        },
        getEmailsFor(email: string) {
          return getEmailsForRecipient(email)
        },
        clearEmails() {
          return clearMailhogEmails()
        },
        getRegistrationLink(email: string) {
          return getRegistrationLinkFromEmail(email)
        },
      })
    },
  },
})
