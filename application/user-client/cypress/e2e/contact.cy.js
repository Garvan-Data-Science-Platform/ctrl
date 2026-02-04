/// <reference types="cypress" />

const { TestUsers } = require('../../../common/testing/constants')

beforeEach(() => {
  cy.task('reset')
})

describe('basic', () => {
  it('can send a message and redirect to success page', () => {
    cy.login(TestUsers.PARTICIPANT_UNANSWERED.email)
    cy.visit('/contact')

    //Does not send if no text is present
    cy.get('[data-cy="send-button"]').click()
    cy.get('[data-cy="message-box"]').type('Hello')
    cy.get('[data-cy="send-button"]').click()

    cy.intercept('**/contact-us', {
      success: true,
    })
    cy.contains('Your message has been sent').should('exist')
  })
  it('displays error message if backend error', () => {
    cy.login(TestUsers.PARTICIPANT_UNANSWERED.email)
    cy.visit('/contact')

    cy.intercept('**/contact-us', {
      statusCode: 500,
      body: { message: 'internal server error' },
    })

    cy.on('window:alert', (text) => {
      // Assert the text of the alert
      expect(text).to.include('Error sending message')
    })

    cy.get('[data-cy="message-box"]').type('Hello')
    cy.get('[data-cy="send-button"]').click()
  })
})
