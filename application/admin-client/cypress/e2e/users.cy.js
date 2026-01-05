/// <reference types="cypress" />

const { UserType } = require('../support/commands')

beforeEach(() => {
  cy.task('reset')
})

describe('Users', () => {
  it('List users', () => {
    cy.login(UserType.ORG_ADMIN)
    cy.visit('/users')
    cy.contains('Users').should('exist')
  })

  it('View single user', () => {
    cy.login(UserType.ORG_ADMIN)
    cy.visit('/users')
    cy.get('[data-cy="view-button"]').first().click()
    cy.contains('First Name').should('exist')
  })
  it('Create user', () => {
    cy.login(UserType.ORG_ADMIN)
    cy.visit('/users')
    cy.contains('Create').click()
    cy.url().should('contain', '/users/create')
    cy.get('[data-cy="create-first"]').type('Elvis')
    cy.get('input').eq(1).type('Presley')
    cy.get('input').eq(2).type('elvis@example.com')
    cy.contains('Save').click()
    cy.contains('Created at').should('exist')
    cy.contains('elvis@example.com').should('exist')
  })
  it('Edit user', () => {
    cy.login(UserType.ORG_ADMIN)
    cy.visit('/users')
    cy.get('[data-cy="edit-button"]').eq(1).click()
    cy.get('input').eq(0).type('A')
    cy.contains('Save').click()
    cy.contains('Success').should('exist')
    cy.visit('/users')
    cy.contains('OrganisationA').should('exist')
  })
})
