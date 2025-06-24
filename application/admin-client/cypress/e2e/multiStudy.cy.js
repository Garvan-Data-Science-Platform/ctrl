/// <reference types="cypress" />

const { UserType } = require('../support/commands')

beforeEach(() => {
  cy.task('reset')
  cy.login(UserType.ADMIN)
})

describe('Multi-study features', () => {
  function changeStudy(name) {
    cy.get('[data-cy="study-dropdown"]').click()
    cy.contains(name).click()
  }

  it('Can create a new study', () => {
    cy.visit('/')
    cy.get('[data-cy="study-dropdown"]').click()
    cy.get('[data-cy="new-study-button"]').click()
    cy.get('[data-cy="study-create"]').click()
    cy.get('[data-cy="study-name"] input').should('be.focused').type('TEST')
    cy.get('[data-cy="study-create"]').click()
    cy.get('[data-cy="study-create"]').should('not.exist')
    cy.get('[data-cy="study-dropdown"]').should('have.text', 'TEST')
  })
  it('Can changes studies, all data is updated accordingly', () => {
    cy.visit('/')
    cy.get('[data-cy="study-dropdown"]').click()
    cy.get('[data-cy="new-study-button"]').click()
    cy.get('[data-cy="study-create"]').click()
    cy.get('[data-cy="study-name"] input').should('be.focused').type('TEST')
    cy.get('[data-cy="study-create"]').click()
    //List of surveys
    changeStudy('Test Study')
    cy.visit('/surveys')
    cy.get('[role="rowgroup"]').children().should('have.length', 2)
    changeStudy('Study 2')
    cy.get('[role="rowgroup"]').children().should('have.length', 1)
    //Survey version data is updated correctly (`TEST` has no content)
    changeStudy('TEST')
    cy.get('[data-cy="edit-draft-button"]').click()
    cy.get('[data-cy="step-list"]').children().should('have.length', 0)
    cy.get('[data-cy="study-dropdown"]').should('be.disabled')
    cy.contains('Surveys').click()
    changeStudy('Test Study')
    cy.get('[data-cy="edit-draft-button"]').click()
    cy.get('[data-cy="step-list"]').children().should('have.length', 2)
    //List of participants and invitations
    cy.contains('Participants').click()
    cy.get('[data-cy="participants-list"]').should('contain.text', 'Second')
    cy.get('[data-cy="pending-list"]').should('contain.text', 'Pending')
    cy.get('[data-cy="pending-list"]').should('contain.text', 'Revoked')
    cy.get('[data-cy="pending-list"]').should('contain.text', 'Expired')
    changeStudy('Study 2')
    cy.get('[data-cy="participants-list"]').should('not.contain.text', 'Second')
    cy.get('[data-cy="pending-list"]').should('not.contain.text', 'Revoked')
    cy.get('[data-cy="pending-list"]').should('not.contain.text', 'Expired')
  })

  it('Maintains active study between browsing sessions', () => {
    cy.visit('/')
    cy.get('[data-cy="study-dropdown"]').should('have.text', 'Test Study')
    changeStudy('Study 2')
    cy.visit('/')
    cy.get('[data-cy="study-dropdown"]').should('have.text', 'Study 2')
  })
})
