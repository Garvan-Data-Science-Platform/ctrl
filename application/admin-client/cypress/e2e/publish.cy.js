/// <reference types="cypress" />

const { UserType } = require('../../../common/cypress/support/commands')

beforeEach(() => {
  cy.task('reset')
})

describe('Publish and complete', () => {
  it('Publish', () => {
    cy.login(UserType.ADMIN)
    cy.visit('/surveys/edit/2')
    cy.contains('Publish').click()
    cy.get('[data-cy="publish-confirm"]').click()
    cy.contains('2').should('exist')
    cy.visit('/participants')

    cy.get('[data-rowindex="0"]').contains('V2').trigger('mouseover', { force: true })
    cy.contains('Incomplete').should('be.visible')
    cy.task('partialComplete')
    cy.visit('/participants')
    cy.get('[data-rowindex="0"]').contains('V2').trigger('mouseover', { force: true })
    cy.contains('Partially Complete').should('be.visible')
  })
})
