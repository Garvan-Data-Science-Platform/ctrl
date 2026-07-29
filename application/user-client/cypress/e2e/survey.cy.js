/// <reference types="cypress" />

const { TestUsers } = require('../../../common/testing/constants.ts')

beforeEach(() => {
  cy.task('reset')
})

describe('Profile Edit', () => {
  it('Marked as reviewed with correct date after page saved', () => {
    cy.login(TestUsers.PARTICIPANT_UNANSWERED.email)
    cy.visit('/')
    cy.contains('Intro').should('exist')
    cy.get('[data-cy="step-card-0"]').contains('Requires Review').should('exist')
    cy.get('[data-cy="step-button-0"]').click()
    cy.contains('Save').click()
    cy.get('[data-cy="step-card-0"]').contains('Reviewed').should('exist')
    cy.get('[data-cy="step-card-0"]').contains(new Date().toLocaleDateString()).should('exist')
  })

  it('Shows correct messsage when required box is not ticked', () => {
    cy.login(TestUsers.PARTICIPANT_UNANSWERED.email)
    cy.visit('/')
    cy.contains('Intro').should('exist')
    cy.get('[data-cy="step-button-1"]').click()
    cy.get('[data-cy="checkbox-0"] input').should('not.be.checked')
    cy.get('input[type="radio"]').eq(1).click()
    cy.contains('Save').click()
    cy.contains('Review Answers').click()
    cy.contains('Save').click()
    cy.get('[data-cy="proceed-button"]').click()
    cy.get('[data-cy="step-card-1"]').contains('Reviewed').should('exist')
    cy.contains('Welcome').should('exist')
  })

  it('Saves answers', () => {
    cy.login(TestUsers.PARTICIPANT_UNANSWERED.email)
    cy.visit('/')
    cy.contains('Intro').should('exist')
    cy.get('[data-cy="step-button-1"]').click()
    cy.get('[data-cy="checkbox-0"]').click()
    cy.get('[data-cy="checkbox-0"] input').should('be.checked')
    cy.get('input[type="radio"]').eq(1).should('not.be.checked')
    cy.get('input[type="radio"]').eq(1).click()
    cy.contains('Save').click()
    cy.visit('/')
    cy.get('[data-cy="step-button-1"]').click()
    cy.get('input[type="radio"]').eq(1).should('be.checked')
  })

  it('Shows error when radio not checked', () => {
    cy.login(TestUsers.PARTICIPANT_UNANSWERED.email)
    cy.visit('/')
    cy.contains('Intro').should('exist')
    cy.get('[data-cy="step-button-1"]').click()
    cy.get('[data-cy="checkbox-0"]').click()
    cy.get('[data-cy="checkbox-0"] input').should('be.checked')
    cy.get('input[type="radio"]').eq(0).should('not.be.checked')
    cy.get('input[type="radio"]').eq(1).should('not.be.checked')
    cy.contains('Save').click()
    cy.contains('Please select').should('exist')
    cy.get('input[type="radio"]').eq(0).click()
    cy.contains('Please select').should('not.exist')
  })

  it('When a new survey version is published their answers require review', () => {
    cy.login(TestUsers.PARTICIPANT_COMPLETED.email)
    cy.visit('/')
    cy.get('[data-cy="step-card-1"]').contains('Reviewed').should('exist')
    cy.task('publish')
    cy.visit('/')
    cy.get('[data-cy="step-card-1"]').contains('Reviewed').should('not.exist')
  })
})
