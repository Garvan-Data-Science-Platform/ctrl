/// <reference types="cypress" />

const { UserType } = require('../support/commands')

beforeEach(() => {
  cy.task('reset')
})

describe('Survey Editor', () => {
  it('Edit title and description', () => {
    cy.login(UserType.ADMIN)
    cy.visit('/')
    cy.contains('Users').should('exist')
  })
  it('Add, delete and rearrange questions', () => {})
  it('Add, delete and rearrange steps', () => {})
  it('Publish', () => {})
})
