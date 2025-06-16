/// <reference types="cypress" />

const { UserType } = require('../support/commands')

beforeEach(() => {
  cy.task('reset')
})

describe('multistudy', () => {
  it('Can change study and see correct steps', () => {
    cy.login(UserType.PARTICIPANT_UNANSWERED)
    cy.visit('/')
    cy.contains('Intro').should('exist')
    cy.get('[data-cy="change-study"]').click()
    cy.contains('Study 2').click()
    cy.contains('Study2step').should('exist')
  })

  it('Saves active study between reloads', () => {
    cy.login(UserType.PARTICIPANT_UNANSWERED)
    cy.visit('/')
    cy.contains('Intro').should('exist')
    cy.get('[data-cy="change-study"]').click()
    cy.contains('Study 2').click()
    cy.visit('/')
    cy.contains('Study2step').should('exist')
  })

  it('Can choose study by url param', () => {
    cy.login(UserType.PARTICIPANT_UNANSWERED)
    cy.visit('/?studyId=2')
    cy.contains('Study2step').should('exist')
  })
  it('Can save answers after changing study', () => {
    cy.login(UserType.PARTICIPANT_UNANSWERED)
    cy.visit('/')
    cy.contains('Intro').should('exist')
    cy.get('[data-cy="change-study"]').click()
    cy.contains('Study 2').click()
    cy.get('[data-cy="step-button-0"]').click()
    cy.get('input[type="checkbox"]').click()
    cy.contains('Save').click()
    cy.contains('Reviewed').should('exist')
    cy.contains('Study 2').should('exist')
  })
})
