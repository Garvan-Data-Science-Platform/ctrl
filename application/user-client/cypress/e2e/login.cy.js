/// <reference types="cypress" />

const { TestUsers } = require('../../../common/testing/constants')

beforeEach(() => {
  cy.task('reset')
})

describe('Login', () => {
  it('Can log in', () => {
    cy.visit('/')
    cy.get('[data-cy="login-email"]').type(TestUsers.PARTICIPANT_UNANSWERED.email)
    cy.get('[data-cy="login-password"]').type(TestUsers.PARTICIPANT_UNANSWERED.password)
    cy.contains('Log In').click()
    cy.contains('Welcome').should('exist')
  })

  it('Gets correct message if password is incorrect', () => {
    cy.visit('/')
    cy.get('[data-cy="login-email"]').type(TestUsers.PARTICIPANT_UNANSWERED.email)
    cy.get('[data-cy="login-password"]').type('Passwordwrong67')
    cy.contains('Log In').click()
    cy.contains('Invalid credentials').should('exist')
  })
})
