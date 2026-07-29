/// <reference types="cypress" />

const { TestUsers } = require('../../../common/testing/constants')

beforeEach(() => {
  cy.task('reset')
})

describe('Elsa Integration', () => {
  it('Can disable and enable Elsa Integration', () => {
    cy.login(TestUsers.ORG_ADMIN.email)
    cy.visit('/integrations')
    cy.get('[data-cy="elsa-checkbox"] input').should('be.checked').click()
    cy.get('[data-cy="confirm"]').click()
    cy.get('[data-cy="elsaToken"]').should('not.exist')
    cy.get('[data-cy="elsa-checkbox"] input').check()
    cy.get('[data-cy="elsaToken"] button').click()
    cy.get('[data-cy="elsaToken"] input').invoke('val').should('include', 'ctrl-elsa')
  })
})
