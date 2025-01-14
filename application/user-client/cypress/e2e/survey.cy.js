/// <reference types="cypress" />

const { UserType } = require('../support/commands')

beforeEach(() => {
  cy.task('reset')
})

describe('Profile Edit', () => {
  it('Changes to alternative contact are saved', () => {
    cy.login(UserType.PARTICIPANT_UNANSWERED)
    cy.visit('/')
    cy.contains('Intro').should('exist')
    cy.get('[data-cy="step-card-0"]').contains('Requires Review').should('exist')
    cy.get('[data-cy="step-button-0"]').click()
    cy.contains('Save').click()
    cy.get('[data-cy="step-card-0"]').contains('Reviewed').should('exist')
    cy.get('[data-cy="step-card-0"]').contains(new Date().toLocaleDateString()).should('exist')
  })
})
