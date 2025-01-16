/// <reference types="cypress" />

const { UserType } = require('../support/commands')

describe('Password Reset', () => {
  it('Can generate a reset link', () => {
    cy.visit('/')
    cy.contains('Password').click()
    cy.get('input').type('tXXXXX@example.com')
    cy.contains('Reset Password').click()
    cy.contains('If your email').should('exist')
  })
})
