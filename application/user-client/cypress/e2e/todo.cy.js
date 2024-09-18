/// <reference types="cypress" />

describe('example to-do app', () => {
  it('renders homepage', () => {
    cy.visit('/')
    cy.contains('My Activities').should('exist')
  })
})
