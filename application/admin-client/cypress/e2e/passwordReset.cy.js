/// <reference types="cypress" />

const { TestUsers } = require('../../../common/testing/constants')

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
    cy.get('input[name="email"]').type(TestUsers.ORG_ADMIN.email)
    cy.intercept(
      'POST',
      '/users/password/generate-reset-link',
      `[{ email: ${TestUsers.ORG_ADMIN.email}}]`,
    ).as('requestReset')
    cy.get('button[type="submit"]').click()
    cy.wait('@requestReset')
    cy.url().should('contain', 'login')
  })

  it('opens password reset page and enters invalid password - too short', () => {
    cy.visit('/update-password?token=valid-reset-token')
    cy.get('input[id="password"]').type('pass')
    cy.get('input[id="confirmPassword"]').type('pass{enter}')
    cy.contains('Invalid password. Password must be at least').should('exist')
  })

  it('opens password reset page and enters invalid password - easily guessable', () => {
    cy.visit('/update-password?token=valid-reset-token')
    cy.get('input[id="password"]').type('Testpassword1')
    cy.get('input[id="confirmPassword"]').type('Testpassword1{enter}')
    cy.contains('Invalid password').should('exist')
    cy.contains('must not contain easily guessable').should('exist')
  })

  it('rejects a new password containing the users personal info', () => {
    cy.intercept('POST', '/users/password/reset').as('resetRequest')
    cy.visit('/update-password?token=valid-reset-token')
    cy.get('input[id="password"]').type('ResetCorduroy2026')
    cy.get('input[id="confirmPassword"]').type('ResetCorduroy2026{enter}')
    cy.wait('@resetRequest').its('response.statusCode').should('eq', 422)
  })

  it('opens password reset page and enters non-matching passwords', () => {
    cy.visit('/update-password?token=valid-reset-token')
    cy.get('input[id="password"]').type('pass')
    cy.get('input[id="confirmPassword"]').type('pass2{enter}')
    cy.contains('match').should('exist')
  })

  it('requests password reset with invalid token', () => {
    cy.visit('/update-password?token=invalid-reset-token')
    cy.get('input[id="password"]').type(TestUsers.ORG_ADMIN.password)
    cy.get('input[id="confirmPassword"]').type(`${TestUsers.ORG_ADMIN.password}{enter}`)
    cy.contains('Error resetting').should('exist')
  })

  it('requests password reset with already-used token', () => {
    cy.visit('/update-password?token=valid-reset-token')
    cy.get('input[id="password"]').type(TestUsers.ORG_ADMIN.password)
    cy.get('input[id="confirmPassword"]').type(`${TestUsers.ORG_ADMIN.password}{enter}`)
    cy.contains('Success').should('exist')

    cy.visit('/update-password?token=valid-reset-token')
    cy.get('input[id="password"]').type(TestUsers.ORG_ADMIN.password)
    cy.get('input[id="confirmPassword"]').type(`${TestUsers.ORG_ADMIN.password}{enter}`)
    cy.contains('Error').should('exist')
  })

  it('resets password and logs in with new password', () => {
    cy.visit('/update-password?token=valid-reset-token')
    cy.get('input[id="password"]').type(TestUsers.ORG_ADMIN.password)
    cy.get('input[id="confirmPassword"]').type(`${TestUsers.ORG_ADMIN.password}{enter}`)
    cy.contains('Success').should('exist')
    cy.get('input[name="email"]').type(TestUsers.PASSWORD_RESET_USER.email)
    cy.get('input[name="password"]').type(TestUsers.PASSWORD_RESET_USER.password)
    cy.get('button[type="submit"]').click()
    cy.contains('admin priv').should('exist')
  })
})
