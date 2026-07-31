/// <reference types="cypress" />
const { TestUsers } = require('../../../common/testing/constants')

describe('Setup', () => {
  it('Redirects to setup page if database empty, can register', () => {
    cy.task('wipe')
    cy.visit('/')
    cy.url().should('contain', '/setup')
    cy.get('[data-cy="setup-email"]').type('abc@d.com')
    cy.get('[data-cy="setup-password"]').type(TestUsers.ORG_ADMIN.password) // Using test data to conform to pr requirements
    cy.get('[data-cy="setup-submit"]').click()
    cy.url().should('contain', '/surveys')
    cy.visit('/surveys')
    cy.contains('Current Draft').should('exist')
  })

  it('Rejects password containing the email local part', () => {
    cy.task('wipe')
    cy.visit('/')
    cy.url().should('contain', '/setup')
    cy.get('[data-cy="setup-email"]').type('tanuj@example.com')
    cy.get('[data-cy="setup-password"]').type('MyTanujCorduroy26')
    cy.get('[data-cy="setup-submit"]').click()
    cy.contains('Invalid password').should('exist')
    cy.contains('contains personal information').should('exist')
  })
})
