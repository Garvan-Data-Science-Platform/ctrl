/// <reference types="cypress" />

describe('Setup', () => {
  it('Redirects to setup page if database empty, can register', () => {
    cy.task('wipe')
    cy.visit('/')
    cy.url().should('contain', '/setup')
    cy.get('[data-cy="setup-email"]').type('abc@d.com')
    cy.get('[data-cy="setup-password"]').type('asdfSDFSDIF12343@$#@')
    cy.get('[data-cy="setup-submit"]').click()
    cy.url().should('contain', '/users')
    cy.visit('/surveys')
    cy.contains('Current Draft').should('exist')
  })
})
