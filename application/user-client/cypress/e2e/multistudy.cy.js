/// <reference types="cypress" />

const { UserType } = require('../support/commands')

beforeEach(() => {
  cy.task('reset')
})

describe('multistudy', () => {
  it('Can change study and see correct steps', () => {
    cy.login(UserType.PARTICIPANT_UNANSWERED)
    cy.visit('/')

    cy.contains('Step 1').should('exist')

    cy.get('[data-cy="change-study"]').click()
    cy.contains('Study 2').click()
  })

  it('Saves active study between reloads', () => {})

  it('Can choose study by url param', () => {})

  it('Can save answers after changing study', () => {})
})
