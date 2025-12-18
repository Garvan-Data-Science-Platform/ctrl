/// <reference types="cypress" />

const { UserType } = require('../../../common/cypress/support/commands')

beforeEach(() => {
  cy.task('reset')
})

describe('Surveys', () => {
  it('List surveys', () => {
    cy.login(UserType.ADMIN)
    cy.visit('/surveys')
    cy.contains('Surveys').should('exist')
    cy.contains('Current Draft').should('exist')
    cy.get('[data-cy="edit-button"]').should('exist')
    cy.get('[data-cy="view-button"]').should('exist')
  })

  it('View a survey', () => {
    cy.login(UserType.ADMIN)
    cy.visit('/surveys')
    cy.get('[data-cy="view-button"]').click()

    cy.contains('introduction video').should('exist')

    cy.contains('Step 2').click()

    // All inputs disabled
    cy.get('[data-cy="survey-editor"]')
      .find('input')
      .each(($el) => {
        expect($el).to.be.disabled
      })

    //All buttons disabled
    cy.get('[data-cy="survey-editor"]')
      .find('button')
      .each(($el) => {
        if (!$el.text == 'Advanced Options') expect($el).to.be.disabled
      })
  })
})
