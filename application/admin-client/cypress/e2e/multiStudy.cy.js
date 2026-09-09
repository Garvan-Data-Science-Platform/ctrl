/// <reference types="cypress" />

const { TestUsers, TestStudies } = require('../../../common/testing/constants')

beforeEach(() => {
  cy.task('reset')
  cy.login(TestUsers.ORG_ADMIN.email)
})

describe('Multi-study features', () => {
  function changeStudy(name) {
    cy.get('[data-cy="study-dropdown"]').click()
    cy.get('ul[role="menu"]').contains(name).click()
    cy.get('[data-cy="study-dropdown"]').contains(name).should('exist')
  }
  it('Can changes studies, all data is updated accordingly', () => {
    cy.visit('/studies')
    cy.get('[data-cy="new-study-button"]').click()
    cy.get('[data-cy="study-name"] input').type('TEST')
    cy.get('[data-cy="study-create"]').click()
    cy.visit('/surveys')
    //List of surveys
    changeStudy(TestStudies.TEST_STUDY.name)
    cy.get('[role="rowgroup"]').children().should('have.length', 2)
    changeStudy(TestStudies.TEST_STUDY_2.name)
    cy.get('[role="rowgroup"]').children().should('have.length', 1)
    //Survey version data is updated correctly (`TEST` has no content)
    changeStudy('TEST')
    cy.get('[data-cy="edit-draft-button"]').click()
    cy.get('[data-cy="step-list"]').children().should('have.length', 0)
    cy.get('[data-cy="study-dropdown"]').should('be.disabled')
    cy.contains('Surveys').click()
    changeStudy(TestStudies.TEST_STUDY.name)
    cy.get('[data-cy="edit-draft-button"]').click()
    cy.get('[data-cy="step-list"]').children().should('have.length', 2)
    //List of participants and invitations
    cy.contains('Participants').click()
    cy.get('[data-cy="participants-list"]').should('contain.text', 'Second')
    cy.get('[data-cy="pending-list"]').should('contain.text', 'Pending')
    cy.get('[data-cy="pending-list"]').should('contain.text', 'Revoked')
    cy.get('[data-cy="pending-list"]').should('contain.text', 'Expired')
    changeStudy(TestStudies.TEST_STUDY_2.name)
    cy.get('[data-cy="participants-list"]').should('not.contain.text', 'Second')
    cy.get('[data-cy="pending-list"]').should('not.contain.text', 'Revoked')
    cy.get('[data-cy="pending-list"]').should('not.contain.text', 'Expired')
  })

  it('Maintains active study between browsing sessions', () => {
    cy.visit('/surveys')
    cy.get('[data-cy="study-dropdown"]').should('have.text', 'Test Study')
    changeStudy(TestStudies.TEST_STUDY_2.name)
    cy.visit('/surveys')
    cy.get('[data-cy="study-dropdown"]').should('have.text', TestStudies.TEST_STUDY_2.name)
  })
})
