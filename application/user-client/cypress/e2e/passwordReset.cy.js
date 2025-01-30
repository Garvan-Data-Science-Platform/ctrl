/// <reference types="cypress" />

beforeEach(() => {
  cy.task('reset')
})

describe('Password Reset', () => {
  it('opens login page and clicks password reset button', () => {
    cy.visit('/login')
    cy.get('[data-cy="forgot-password"]').click()
    cy.contains('Please enter the email address you registered with').should('exist')
  })

  it('requests password reset with registered email', () => {
    cy.visit('/forgot')
    cy.get('[data-cy="email"]').type(Cypress.env('PASSWORD_RESET_USER_EMAIL'))
    cy.intercept(
      'POST',
      '/users/password/generate-reset-link',
      '[{ email: @Cypress.env("PASSWORD_RESET_USER_EMAIL")}]',
    ).as('requestReset')
    cy.get('[data-cy="request-reset-button"]').click()
    cy.wait('@requestReset')
    cy.contains('If your email is in our system').should('exist')
  })

  it('requests password reset with unknown email', () => {
    cy.visit('/forgot')
    cy.get('[data-cy="email"]').type('nouser@notevenanemailaddress')
    cy.intercept(
      'POST',
      '/users/password/generate-reset-link',
      '[{ email: @Cypress.env("PASSWORD_RESET_USER_EMAIL")}]',
    ).as('requestReset')
    cy.get('[data-cy="request-reset-button"]').click()
    cy.wait('@requestReset')
    cy.contains('If your email is in our system').should('exist')
  })

  it('requests password reset and returns to login page', () => {
    cy.visit('/forgot')
    cy.get('[data-cy="email"]').type(Cypress.env('PASSWORD_RESET_USER_EMAIL'))
    cy.intercept(
      'POST',
      '/users/password/generate-reset-link',
      '[{ email: @Cypress.env("PASSWORD_RESET_USER_EMAIL")}]',
    ).as('requestReset')
    cy.get('[data-cy="request-reset-button"]').click()
    cy.wait('@requestReset')
    cy.get('[data-cy="return-to-login"]').click()
    cy.get('[data-cy="login-email"]').should('exist')
    cy.get('[data-cy="login-password"]').should('exist')
    cy.get('[data-cy="register"]').should('exist')
    cy.get('[data-cy="forgot-password"]').should('exist')
  })

  it('opens password reset page and returns to login page', () => {
    cy.visit('/reset-password?token=valid-reset-token')
    cy.get('[data-cy="return-to-login"]').click()
    cy.get('[data-cy="login-email"]').should('exist')
    cy.get('[data-cy="login-password"]').should('exist')
    cy.get('[data-cy="register"]').should('exist')
    cy.get('[data-cy="forgot-password"]').should('exist')
  })

  it('opens password reset page and enters invalid password - too short', () => {
    cy.visit('/reset-password?token=valid-reset-token')
    cy.get('[data-cy="new-password"]').type('pass{enter}')
    cy.contains('Invalid password. Password must be at least').should('exist')
  })

  it('opens password reset page and enters invalid password - no number', () => {
    cy.visit('/reset-password?token=valid-reset-token')
    cy.get('[data-cy="new-password"]').type('Password{enter}')
    cy.contains('Invalid password. Password must contain at least one number').should('exist')
  })

  it('opens password reset page and enters invalid password - no uppercase', () => {
    cy.visit('/reset-password?token=valid-reset-token')
    cy.get('[data-cy="new-password"]').type('password1{enter}')
    cy.contains('Invalid password. Password must contain at least one uppercase').should('exist')
  })

  it('opens password reset page and enters non-matching passwords', () => {
    cy.visit('/reset-password?token=valid-reset-token')
    cy.get('[data-cy="new-password"]').type('Password1')
    cy.get('[data-cy="confirm-password"]').type('Password2{enter}')
    cy.contains('Your passwords do not match').should('exist')
  })

  it('opens password reset page without token', () => {
    cy.visit('/reset-password')
    cy.contains('Missing token').should('exist')
    cy.get('[data-cy="return-to-login"]').click()
    cy.get('[data-cy="login-email"]').should('exist')
    cy.get('[data-cy="login-password"]').should('exist')
    cy.get('[data-cy="register"]').should('exist')
    cy.get('[data-cy="forgot-password"]').should('exist')
  })

  it('requests password reset with invalid token', () => {
    cy.visit('/reset-password?token=invalid-reset-token')
    cy.get('[data-cy="new-password"]').type('Password1{enter}')
    cy.get('[data-cy="confirm-password"]').type('Password1{enter}')
    cy.contains('Invalid token').should('exist')
    cy.get('[data-cy="return-to-login"]').should('exist')
  })

  it('requests password reset with already-used token', () => {
    cy.visit('/reset-password?token=valid-reset-token')
    cy.get('[data-cy="new-password"]').type('Password1{enter}')
    cy.get('[data-cy="confirm-password"]').type('Password1{enter}')
    cy.contains('Password reset was successful').should('exist')
    cy.get('[data-cy="return-to-login"]').click()

    cy.visit('/reset-password?token=valid-reset-token')
    cy.get('[data-cy="new-password"]').type('Password1{enter}')
    cy.get('[data-cy="confirm-password"]').type('Password1{enter}')
    cy.contains('Invalid token').should('exist')
    cy.get('[data-cy="return-to-login"]').should('exist')
  })

  it('resets password and logs in with new password', () => {
    const newPassword = 'Password1'
    cy.visit('/reset-password?token=valid-reset-token')
    cy.get('[data-cy="new-password"]').type(newPassword)
    cy.get('[data-cy="confirm-password"]').type(newPassword)
    cy.get('[data-cy="reset-password"]').click()
    cy.get('[data-cy="return-to-login"]').click()
    cy.get('[data-cy="login-email"]').type(Cypress.env('PASSWORD_RESET_USER_EMAIL'))
    cy.get('[data-cy="login-password"]').type(newPassword)
    cy.get('[data-cy="login"]').click()
    cy.contains('Welcome').should('exist')
  })
})
