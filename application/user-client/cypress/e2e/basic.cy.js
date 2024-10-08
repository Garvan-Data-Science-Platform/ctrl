/// <reference types="cypress" />

describe('basic', () => {
  it('renders homepage', () => {
    cy.visit('/')
    cy.contains('Log In').should('exist')
  })
})
