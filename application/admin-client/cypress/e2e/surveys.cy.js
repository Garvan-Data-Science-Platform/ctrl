/// <reference types="cypress" />

const { UserType } = require('../support/commands')

beforeEach(() => {
  cy.task('reset')
})

describe('Surveys', () => {
  it('List surveys', () => {
    cy.login(UserType.ADMIN)
    cy.visit('/')
    cy.contains('Users').should('exist')
  })
  it('Survey list buttons', () => {})
  it('View a survey', () => {
    //All inputs and buttons should be disabled
    //Navigate steps
  })
})
