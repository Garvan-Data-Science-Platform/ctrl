/// <reference types="cypress" />

const { TestUsers } = require('../../../common/testing/constants')
const { VALIDATION_MESSAGES } = require('../../../common/src/validation')

beforeEach(() => {
  cy.task('reset')
  cy.login(TestUsers.ORG_ADMIN.email)
})

describe('', () => {
  it('Invite dialog', () => {
    cy.visit('/participants')
    cy.get('[data-cy="invite-modal"]').should('not.exist')
    cy.get('[data-cy="invite-button"]').click()
    cy.get('[data-cy="invite-modal"]').should('exist')
    cy.get('[data-cy="invite-modal-cancel"]').click()
    cy.get('[data-cy="invite-modal"]').should('not.exist')
  })

  it('Should not allow inviting users when there is no published survey in the study', () => {
    cy.visit('/participants')
    cy.get('[data-cy="study-dropdown"]').click()
    cy.contains('Empty Study').click()
    cy.get('[data-cy="invite-modal"]').should('not.exist')
    cy.get('[data-cy="invite-button"]').click()
    cy.get('[data-cy="invite-modal"]').should('not.exist')
    cy.get('[data-cy="no-published-survey-modal"]')
      .should('exist')
      .should('contain.text', 'You need to publish a survey before inviting participants')
    cy.contains('Go to surveys').click()
    cy.url().should('contain', '/surveys')
  })

  it('Can type invites manually and remove', () => {
    cy.visit('/participants')
    cy.get('[data-cy="invite-button"]').click()
    cy.get('[data-cy="send-button"]').should('be.disabled')
    cy.get('[data-cy="email-field"]').type('invalidemail').type('{enter}')
    cy.get('[data-cy="recipients-list"]').should('not.contain.text', 'invalidemail')
    cy.get('[data-cy="email-field"]').clear().type('valid1@g.co').type('{enter}')
    cy.get('[data-cy="recipients-list"]').should('contain.text', 'valid1@g.co')
    cy.get('[data-cy="email-field"]').clear().type('valid2@g.co')
    cy.get('[data-cy="add-button"]').click()
    cy.get('[data-cy="recipients-list"]').should('contain.text', 'valid2@g.co')
    cy.get('[data-cy="remove-button"]').first().click()
    cy.get('[data-cy="recipients-list"]').should('not.contain.text', 'valid1@g.co')
  })

  it('Can paste invites', () => {
    cy.visit('/participants')
    cy.get('[data-cy="invite-button"]').click()
    cy.get('[data-cy="email-field"]').trigger('paste', {
      bubbles: true,
      cancelable: true,
      clipboardData: { getData: (type) => 'email1@g.co\nemail2@g.co' },
    })
    cy.get('[data-cy="recipients-list"]')
      .should('contain.text', 'email1@g.co')
      .should('contain.text', 'email2@g.co')
  })

  it('Can paste invites with external ID', () => {
    cy.visit('/participants')
    cy.get('[data-cy="invite-button"]').click()
    cy.get('[data-cy="email-field"]').trigger('paste', {
      bubbles: true,
      cancelable: true,
      clipboardData: { getData: (type) => 'email1@g.co\tabc123\nemail2@g.co' },
    })
    cy.get('[data-cy="recipients-list"]')
      .should('contain.text', 'email1@g.co')
      .should('contain.text', 'email2@g.co')
      .should('contain.text', 'abc123')
    cy.contains('(2)').should('exist')
  })

  it('Should load text from the backend correctly', () => {
    cy.visit('/participants')
    cy.get('[data-cy="invite-button"]').click()
    cy.get('[data-cy="email-subject"]').should('contain.text', 'Invitation to CTRL')
    cy.get('[data-cy="email-text"]').should('contain.text', 'You have been invited')
  })

  it('Sent invites appear in invites list', () => {
    cy.visit('/participants')
    cy.get('[data-cy="invite-button"]').click()
    cy.get('[data-cy="email-field"]').clear().type('valid1@g.co').type('{enter}')
    cy.get('[data-cy="send-button"]').click()
    cy.get('[data-cy="pending-list"]', { timeout: 10000 }).should('contain.text', 'valid1@g.co')
  })
  it('Can revoke an invite', () => {
    cy.visit('/participants')
    cy.get('[data-cy="pending-list"]').get('[data-rowindex="0"]').should('contain.text', 'Pending')
    cy.get('[data-cy="invite-actions"]').first().click()
    cy.get('[data-cy="revoke-button"]').click()
    cy.get('[data-cy="pending-list"]').get('[data-rowindex="0"]').should('contain.text', 'Revoked')
  })

  it('Can resend an invite', () => {
    cy.visit('/participants')
    cy.get('[data-cy="pending-list"]').get('[data-rowindex="0"]').should('contain.text', 'Pending')
    cy.get('[data-cy="invite-actions"]').first().click()
    cy.get('[data-cy="resend-button"]').click()
    cy.contains('Invite Resent', { timeout: 10000 }).should('exist')
  })

  it('Should validate xss in email addresses', () => {
    cy.visit('/participants')
    cy.get('[data-cy="invite-button"]').click()
    cy.get('[data-cy="email-field"]')
      .clear()
      .type("{{7*7}}<script>alert('xss-email-address')</script>@gmail.com", {
        parseSpecialCharSequences: false,
      })
      .type('{enter}')
    cy.contains(VALIDATION_MESSAGES.EMAIL_INVALID).should('exist')
    cy.get('[data-cy="send-button"]').should('be.disabled')
  })

  it('Should validate xss in pasted email addresses', () => {
    cy.visit('/participants')
    cy.get('[data-cy="invite-button"]').click()
    cy.get('[data-cy="email-field"]').trigger('paste', {
      bubbles: true,
      cancelable: true,
      clipboardData: {
        getData: (type) =>
          "email1@g.co\n{{7*7}}<script>alert('xss-email-address')</script>@gmail.com",
      },
    })
    cy.get('[data-cy="recipients-list"]')
      .should('contain.text', 'email1@g.co')
      .should('not.contain', 'xss-email-addres')
  })

  it('Should validate xss in External ID', () => {
    cy.visit('/participants')
    cy.get('[data-cy="invite-button"]').click()
    cy.get('[data-cy="email-field"]').clear().type('valid1@g.co')
    cy.get('[data-cy="id-field"]')
      .clear()
      .type("{{7*7}}<script>alert('xss-id-field')</script>", {
        parseSpecialCharSequences: false,
      })
      .type('{enter}')
    cy.contains(VALIDATION_MESSAGES.EXTERNALID_INVALID).should('exist')
    cy.get('[data-cy="recipients-list"]').should('not.contain.text', 'valid1@g.co')
    cy.get('[data-cy="recipients-list"]').should('not.contain.text', 'xss-id-field')
    cy.get('[data-cy="send-button"]').should('be.disabled')
  })

  it('Should validate xss in pasted External ID', () => {
    cy.visit('/participants')
    cy.get('[data-cy="invite-button"]').click()
    cy.get('[data-cy="email-field"]').trigger('paste', {
      bubbles: true,
      cancelable: true,
      clipboardData: {
        getData: (type) =>
          "email1@g.co\t{{7*7}}<script>alert('xss-id-field')</script>\nemail2@g.co\tabc123",
      },
    })
    // Whole row should be dropped if there was an validation error
    cy.get('[data-cy="recipients-list"]').should('not.contain.text', 'email1@g.co')
    cy.get('[data-cy="recipients-list"]').should('not.contain.text', 'xss')
    cy.get('[data-cy="recipients-list"]').should('contain.text', 'email2@g.co(abc123)')
    cy.contains('Skipped 1 entry(s) due to invalid formatting').should('exist')
  })

  it('Should validate xss in email subject', () => {
    cy.visit('/participants')
    cy.get('[data-cy="invite-button"]').click()
    cy.get('[data-cy="email-subject"]').should('contain.text', 'Invitation to CTRL')
    cy.get('[data-cy="email-subject"]')
      .clear()
      .type("Invitation to CTRL{{7*7}}<script>alert('xss-email-subject')</script>", {
        parseSpecialCharSequences: false,
      })
    cy.contains(VALIDATION_MESSAGES.INVITE_EMAIL_SUBJECT_INVALID).should('exist')
    cy.get('[data-cy="send-button"]').should('be.disabled')
  })

  it('Should validate xss in email text', () => {
    cy.visit('/participants')
    cy.get('[data-cy="invite-button"]').click()
    cy.get('[data-cy="email-text"]').should('contain.text', 'You have been invited')
    cy.get('[data-cy="email-text"]')
      .clear()
      .type("You have been invited{{7*7}}<script>alert('xss-email-text')</script>", {
        parseSpecialCharSequences: false,
      })
    cy.contains(VALIDATION_MESSAGES.INVITE_EMAIL_TEXT_INVALID).should('exist')
    cy.get('[data-cy="send-button"]').should('be.disabled')
  })
})
