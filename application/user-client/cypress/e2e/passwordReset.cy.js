/// <reference types="cypress" />

beforeEach(() => {
  cy.task('reset')
})

describe('Password Reset', () => {
  it('open login page and request password reset', () => {
    cy.visit('/login')
    cy.get('[data-cy="forgot-password"]').click()
    cy.contains('Please enter the email address you registered with').should('exist')
  })

  it('open password reset page and request password reset', () => {
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

  it('request password reset with unknown email', () => {
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

  it('request password reset and return to login page', () => {
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

  it('open password reset page and return to login', () => {
    cy.visit('/reset-password?token=valid-reset-token')
    cy.get('[data-cy="return-to-login"]').click()
    cy.get('[data-cy="login-email"]').should('exist')
    cy.get('[data-cy="login-password"]').should('exist')
    cy.get('[data-cy="register"]').should('exist')
    cy.get('[data-cy="forgot-password"]').should('exist')
  })

  it('open password reset page and enter invalid password', () => {
    cy.visit('/reset-password?token=valid-reset-token')
    cy.get('[data-cy="new-password"]').type('pass{enter}')
    cy.contains('Password must be at least').should('exist')
  })

  it('open password reset page and enter non-matching passwords', () => {
    cy.visit('/reset-password?token=valid-reset-token')
    cy.get('[data-cy="new-password"]').type('Password1')
    cy.get('[data-cy="confirm-password"]').type('Password2{enter}')
    cy.contains('Your passwords do not match').should('exist')
  })

  it('open password reset request confirmation page without token', () => {
    cy.visit('/reset-password')
    cy.contains('Invalid or missing token').should('exist')
    cy.get('[data-cy="return-to-login"]').click()
    cy.get('[data-cy="login-email"]').should('exist')
    cy.get('[data-cy="login-password"]').should('exist')
    cy.get('[data-cy="register"]').should('exist')
    cy.get('[data-cy="forgot-password"]').should('exist')
  })
})
