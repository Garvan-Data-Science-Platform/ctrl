/// <reference types="cypress" />

import { AppUrls } from '../support/commands'

beforeEach(() => {
  cy.task('reset')
})

describe('Invites - Full E2E Flow', () => {
  const testEmail = 'newinvitee@example.com'

  it('Admin invites participant, participant registers via invite link', () => {
    // 1. Admin logs in via browser
    cy.loginAdminUI()

    // 2. Admin navigates to participants and sends invite
    cy.visit(AppUrls.ADMIN_CLIENT + '/participants')
    cy.get('[data-cy="invite-button"]').click()
    cy.get('[data-cy="invite-modal"]').should('exist')
    cy.get('[data-cy="email-field"]').type(testEmail).type('{enter}')
    cy.get('[data-cy="send-button"]').click()

    // 3. Verify invite appears in pending list
    cy.get('[data-cy="pending-list"]', { timeout: 10000 }).should('contain.text', testEmail)

    // 4. Get invite ID from database and visit registration page
    cy.task('getInviteId', { email: testEmail, studyId: 1 }).then((inviteId) => {
      // 5. Participant visits invite link (user-client)
      cy.visit(AppUrls.USER_CLIENT + `/register/${inviteId}`)

      // 6. Participant fills registration form
      cy.fillRegistrationForm({ email: testEmail })

      // 7. Submit registration
      cy.get('[data-cy="reg-button"]').click()

      // 8. Assert participant is logged in and sees dashboard
      cy.contains('Welcome Test', { timeout: 10000 }).should('exist')
    })
  })

  it('Participant cannot register with expired invite link', () => {
    // 1. Admin sends invite via UI
    cy.loginAdminUI()
    cy.sendInviteUI(testEmail)

    // 2. Get invite ID and expire it via task
    cy.task('getInviteId', { email: testEmail, studyId: 1 }).then((inviteId) => {
      cy.task('expireInvite', inviteId)

      // 3. Participant visits expired invite link
      cy.visit(AppUrls.USER_CLIENT + `/register/${inviteId}`)

      // 4. Attempt to register
      cy.fillRegistrationForm({ email: testEmail })
      cy.get('[data-cy="reg-button"]').click()

      // 5. Assert error message is shown
      cy.contains('expired', { matchCase: false }).should('exist')
    })
  })

  it('Admin inviting the same email twice should resend invite', () => {
    // 1. Admin logs in and sends first invite
    cy.loginAdminUI()
    cy.visit(AppUrls.ADMIN_CLIENT + '/participants')
    cy.get('[data-cy="invite-button"]').click()
    cy.get('[data-cy="email-field"]').type(testEmail).type('{enter}')
    cy.get('[data-cy="send-button"]').click()
    cy.get('[data-cy="pending-list"]', { timeout: 10000 }).should('contain.text', testEmail)

    // 2. Admin attempts to invite same email again
    cy.get('[data-cy="invite-button"]').click()
    cy.get('[data-cy="email-field"]').type(testEmail).type('{enter}')
    cy.get('[data-cy="send-button"]').click()

    // 3. Assert it succeeds (resends invite)
    cy.get('[data-cy="pending-list"]', { timeout: 10000 }).should('contain.text', testEmail)
  })

  it('Participant cannot register with invalid invite token', () => {
    // 1. Participant visits registration page with invalid token
    cy.visit(AppUrls.USER_CLIENT + '/register/invalid-invite-id-12345')

    // 2. Attempt to fill and submit form
    cy.fillRegistrationForm({ email: 'invalid@test.com' })
    cy.get('[data-cy="reg-button"]').click()

    // 3. Assert error message is shown
    cy.contains('not found', { matchCase: false }).should('exist')
  })

  it('Participant cannot register if already registered', () => {
    // Use an email that already exists in the seed data
    const existingEmail = 'test3@example.com' // PARTICIPANT_COMPLETED from seed

    // 1. Admin logs in and sends invite to existing email
    cy.loginAdminUI()
    cy.visit(AppUrls.ADMIN_CLIENT + '/participants')
    cy.get('[data-cy="invite-button"]').click()
    cy.get('[data-cy="email-field"]').type(existingEmail).type('{enter}')
    cy.get('[data-cy="send-button"]').click()

    // 2. Get invite ID and visit registration
    cy.task('getInviteId', { email: existingEmail, studyId: 1 }).then((inviteId) => {
      cy.visit(AppUrls.USER_CLIENT + `/register/${inviteId}`)

      // 3. Fill form with existing email
      cy.fillRegistrationForm({ email: existingEmail })
      cy.get('[data-cy="reg-button"]').click()

      // 4. Assert error about already registered
      cy.contains(/already|exists|registered/i).should('exist')
    })
  })

  it('Admin revokes invite before participant registers', () => {
    // 1. Admin logs in and sends invite
    cy.loginAdminUI()
    cy.visit(AppUrls.ADMIN_CLIENT + '/participants')
    cy.get('[data-cy="invite-button"]').click()
    cy.get('[data-cy="email-field"]').type(testEmail).type('{enter}')
    cy.get('[data-cy="send-button"]').click()
    cy.get('[data-cy="pending-list"]', { timeout: 10000 }).should('contain.text', testEmail)

    // 2. Admin revokes the invite via UI
    cy.get('[data-cy="invite-actions"]').first().click()
    cy.get('[data-cy="revoke-button"]').click()
    cy.get('[data-cy="pending-list"]').should('contain.text', 'Revoked')

    // 3. Participant visits revoked invite link
    cy.task('getInviteId', { email: testEmail, studyId: 1 }).then((inviteId) => {
      cy.visit(AppUrls.USER_CLIENT + `/register/${inviteId}`)

      // 4. Attempt to register
      cy.fillRegistrationForm({ email: testEmail })
      cy.get('[data-cy="reg-button"]').click()

      // 5. Assert error message
      cy.contains(/revoked|invalid|expired/i).should('exist')
    })
  })

  it('Participant sees validation errors for incomplete registration', () => {
    // 1. Admin sends invite
    cy.loginAdminUI()
    cy.sendInviteUI(testEmail)

    // 2. Get invite ID and visit registration
    cy.task('getInviteId', { email: testEmail, studyId: 1 }).then((inviteId) => {
      cy.visit(AppUrls.USER_CLIENT + `/register/${inviteId}`)

      // 3. Submit with invalid data
      cy.wait(500)
      cy.get('[data-cy="reg-password"]').type('weak')
      cy.get('[data-cy="reg-confirm-password"]').type('different')
      cy.get('[data-cy="reg-postcode"]').type('ABC')
      cy.get('[data-cy="reg-mobile"]').type('123')
      cy.get('[data-cy="reg-button"]').click()

      // 4. Assert validation errors are shown
      cy.contains(/password/i).should('exist')
      cy.get('[data-cy="reg-first"] input').should('be.focused').or('exist')
    })
  })
})
