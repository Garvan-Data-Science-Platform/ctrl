/// <reference types="cypress" />

const { UserType } = require('../support/commands')

beforeEach(() => {
  cy.task('reset')
  cy.login(UserType.ORG_ADMIN)
})

describe('', () => {
  it('Can reach page', () => {
    cy.visit('/surveys')
    cy.get('[data-cy="view-all-responses-button"]').click()
    cy.url().should('contain', '/responses/all/1')
    cy.visit('/surveys')
    cy.get('[data-cy="response-icon-button"]').click()
    cy.url().should('contain', '/responses/all/1')
  })

  it('Can see answers table', () => {
    cy.visit('/responses/all/1')
    cy.get('[role="row"]').eq(1).should('not.contain.text', 'Unanswered User (')
    cy.get('[data-cy="display-sensitive"]').click()
    cy.get('[role="row"]').should('have.length', 5)
    cy.get('[role="row"]')
      .eq(1)
      .should('contain.text', 'Unanswered User (')
      .should('contain.text', 'No Answer')
    cy.get('[role="row"]')
      .eq(2)
      .should('contain.text', 'Completed User (')
      .should('contain.text', 'False')
      .should('contain.text', 'Choice 2')
  })
})
