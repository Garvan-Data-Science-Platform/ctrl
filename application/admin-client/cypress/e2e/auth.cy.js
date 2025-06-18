/// <reference types="cypress" />

const { UserType } = require('../support/commands')

beforeEach(() => {
  cy.task('reset')
})

describe('auth', () => {
  it('renders login page', () => {
    cy.visit('/')
    cy.contains('Sign in to your account').should('exist')
  })

  it('can login as admin to the admin portal', () => {
    cy.visit('/')
    cy.get('input[name="email"]').type(UserType.ADMIN)
    cy.get('input[name="password"]').type('password')
    cy.get('button[type="submit"]').click()
    cy.url().should('include', '/users') // Redirects to /users after login
  })

  it('cannot login as a participant to the admin portal', () => {
    cy.visit('/')
    cy.get('input[name="email"]').type(UserType.PARTICIPANT_COMPLETED)
    cy.get('input[name="password"]').type('password')
    cy.get('button[type="submit"]').click()

    // Expect to stay on the login page & error message popup
    cy.url().should('not.include', '/users')
    cy.contains('Error Logging In: "Incorrect Permissions"').should('exist')
  })
})
