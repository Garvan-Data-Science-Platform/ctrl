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
  it('List user buttons', () => {})
  it('View single user', () => {})
  it('Single user buttons', () => {})
  it('Create user', () => {
    cy.login(UserType.ADMIN)
    cy.visit('/')
  })
  it('Edit user', () => {
    cy.login(UserType.ADMIN)
    cy.visit('/')
  })
})
