/// <reference types="cypress" />

beforeEach(() => {
  cy.task('reset')
})

describe('Password Reset', () => {
  it('Can generate a reset link', () => {
    cy.visit('/')
    cy.get('[data-cy="forgot"]').click()
    cy.get('input').type('tXXXXX@example.com')
    cy.contains('Reset Password').click()
    cy.contains('If your email').should('exist')
  })
})
