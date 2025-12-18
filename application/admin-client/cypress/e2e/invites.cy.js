/// <reference types="cypress" />

const { UserType } = require('../../../common/cypress/support/commands')

beforeEach(() => {
  cy.task('reset')
  cy.login(UserType.ADMIN)
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
})
