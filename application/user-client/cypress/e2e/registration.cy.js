/// <reference types="cypress" />

beforeEach(() => {
  cy.task('reset')
})

describe('basic', () => {
  it('renders homepage', () => {
    cy.visit('/')
    cy.contains('Log In').should('exist')
  })
})
