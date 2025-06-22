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
    cy.contains('Study FE').click()
    cy.contains('Frontend study step').should('exist')
  })

  it('Saves active study between reloads', () => {
    cy.login(UserType.PARTICIPANT_UNANSWERED)
    cy.visit('/')
    cy.contains('Intro').should('exist')
    cy.get('[data-cy="change-study"]').click()
    cy.contains('Study FE').click()
    cy.visit('/')
    cy.contains('Frontend study step').should('exist')
  })

  it('Can choose study by url param', () => {
    cy.login(UserType.PARTICIPANT_UNANSWERED)
    cy.visit('/?studyId=3')
    cy.contains('Frontend study step').should('exist')
  })
  it('Can save answers after changing study', () => {
    cy.login(UserType.PARTICIPANT_UNANSWERED)
    cy.visit('/')
    cy.contains('Intro').should('exist')
    cy.get('[data-cy="change-study"]').click()
    cy.contains('Study FE').click()
    cy.get('[data-cy="step-button-0"]').click()
    cy.get('input[type="checkbox"]').click()
    cy.contains('Save').click()
    cy.contains('Reviewed').should('exist')
    cy.contains('Study FE').should('exist')
  })
})
