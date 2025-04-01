/// <reference types="cypress" />

beforeEach(() => {
  cy.task('reset')
})

describe('Login', () => {
  it('Can log in', () => {
    cy.visit('/')
    cy.get('[data-cy="login-email"]').type('test2@example.com')
    cy.get('[data-cy="login-password"]').type('password')
    cy.contains('Log In').click()
    cy.contains('Welcome').should('exist')
  })

  it('Gets correct message if password is incorrect', () => {
    cy.visit('/')
    cy.get('[data-cy="login-email"]').type('test2@example.com')
    cy.get('[data-cy="login-password"]').type('passwordwrong')
    cy.contains('Log In').click()
    cy.contains('Invalid credentials').should('exist')
  })
})
