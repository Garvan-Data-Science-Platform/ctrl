/// <reference types="cypress" />

const { UserType } = require('../../../common/cypress/support/commands')

beforeEach(() => {
  cy.task('reset')
})

describe('Password Reset', () => {
  it('opens login page and clicks password reset button', () => {
    cy.visit('/login')
    cy.contains('Forgot').click()
    cy.contains('Forgot your password?').should('exist')
  })

  it('requests password reset with registered email', () => {
    cy.visit('/forgot-password')
    cy.get('input[name="email"]').type(UserType.ORG_ADMIN)
    cy.intercept(
      'POST',
      '/users/password/generate-reset-link',
      `[{ email: ${UserType.ORG_ADMIN}}]`,
    ).as('requestReset')
    cy.get('button[type="submit"]').click()
    cy.wait('@requestReset')
    cy.contains('reset link sent').should('exist')
  })

  it('opens password reset page and enters invalid password - too short', () => {
    cy.visit('/update-password?token=valid-reset-token')
    cy.get('input[id="password"]').type('pass')
    cy.get('input[id="confirmPassword"]').type('pass{enter}')
    cy.contains('Invalid password. Password must be at least').should('exist')
  })

  it('opens password reset page and enters non-matching passwords', () => {
    cy.visit('/update-password?token=valid-reset-token')
    cy.get('input[id="password"]').type('pass')
    cy.get('input[id="confirmPassword"]').type('pass2{enter}')
    cy.contains('match').should('exist')
  })

  it('requests password reset with invalid token', () => {
    cy.visit('/update-password?token=invalid-reset-token')
    cy.get('input[id="password"]').type('Password1')
    cy.get('input[id="confirmPassword"]').type('Password1{enter}')
    cy.contains('Error resetting').should('exist')
  })

  it('requests password reset with already-used token', () => {
    cy.visit('/update-password?token=valid-reset-token')
    cy.get('input[id="password"]').type('Password1')
    cy.get('input[id="confirmPassword"]').type('Password1{enter}')
    cy.contains('Success').should('exist')

    cy.visit('/update-password?token=valid-reset-token')
    cy.get('input[id="password"]').type('Password1')
    cy.get('input[id="confirmPassword"]').type('Password1{enter}')
    cy.contains('Error').should('exist')
  })

  it('resets password and logs in with new password', () => {
    cy.visit('/update-password?token=valid-reset-token')
    cy.get('input[id="password"]').type('Password1')
    cy.get('input[id="confirmPassword"]').type('Password1{enter}')
    cy.contains('Success').should('exist')
    cy.get('input[name="email"]').type('test-reset-password@example.com')
    cy.get('input[name="password"]').type('Password1')
    cy.get('button[type="submit"]').click()
    cy.contains('admin priv').should('exist')
  })
})
