/// <reference types="cypress" />

beforeEach(() => {
  cy.task('reset')
})

describe('password-reset', () => {
  function fillEmail() {
    cy.get('[data-cy="email"]').type('valid@email.com')
  }

  it('open login page and request password reset', () => {
    cy.visit('/login')
    cy.get('[data-cy="forgot-password"]').click()
    cy.contains('Please enter the email address you registered with').should('exist')
  })

  it('open password reset page and request password reset', () => {
    cy.visit('/forgot')
    fillEmail()
    cy.get('[data-cy="request-reset-button"]').click()
    cy.contains('An email with password reset link').should('exist')
  })

  // open password reset page and request password reset with incorrect email

  it('open password reset request confirmation page and return to login', () => {
    cy.visit('/reset-request-confirm')
    cy.get('[data-cy="return-to-login"]').click()
    cy.get('[data-cy="register"]').should('exist')
    cy.get('[data-cy="forgot-password"]').should('exist')
  })
})
