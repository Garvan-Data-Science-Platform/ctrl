/// <reference types="cypress" />

const { UserType } = require('../support/commands')

beforeEach(() => {
  cy.task('reset')
})

describe('Users', () => {
  it('List users', () => {
    cy.login(UserType.ADMIN)
    cy.visit('/')
    cy.contains('Users').should('exist')
  })

  it('View single user', () => {
    cy.login(UserType.ADMIN)
    cy.visit('/users')
    cy.get('[data-cy="view-button"]').first().click()
    cy.contains('First Name').should('exist')
  })
  it('Create user', () => {
    cy.login(UserType.ADMIN)
    cy.visit('/users')
    cy.contains('Create').click()
    cy.url().should('contain', '/users/create')
    cy.get('[data-cy="create-first"]').type('Elvis')
    cy.get('input').eq(1).type('Presley')
    cy.get('input').eq(2).type('elvis@example.com')
    cy.get('input').eq(3).type('Password1')
    cy.contains('Save').click()
    cy.contains('Logout').click()
    cy.get('input', { timeout: 10000 }).eq(0).should('be.enabled').type('elvis@example.com')
    cy.get('input').eq(1).type('Password1')
    cy.get('button').click()
    cy.contains('Admin users').should('exist')
  })
  it('Edit user', () => {
    cy.login(UserType.ADMIN)
    cy.visit('/users')
    cy.get('[data-cy="edit-button"]').first().click()
    cy.get('input').eq(0).type('A')
    cy.contains('Save').click()
    cy.contains('OperatorA').should('exist')
  })
})
