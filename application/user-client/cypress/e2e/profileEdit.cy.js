/// <reference types="cypress" />

const { TestUsers } = require('../../../common/testing/constants')

beforeEach(() => {
  cy.task('reset')
})

describe('Profile Edit', () => {
  function makeChanges() {
    cy.login(TestUsers.PARTICIPANT_UNANSWERED.email)
    cy.visit('/profile/update')
    cy.get('[data-cy="update-first"] input').clear()
    cy.get('[data-cy="update-first"]').type('Johnny')
    cy.get('[data-cy="update-mobile"] input').clear()
    cy.get('[data-cy="update-mobile"]').type('0487654321')
    cy.get('[data-cy="update-button"]').click()
    cy.get('[data-cy="profile-first"]').should('exist')
    cy.contains('Johnny').should('exist')
    cy.contains('0487654321').should('exist')
  }
  it('Opens edit page and makes changes', () => {
    makeChanges()
    cy.visit('/')
    cy.contains('Personal Details').click()
    cy.contains('Johnny').should('exist')
  })
  it('Make changes in mobile view', () => {
    cy.viewport('iphone-8')
    makeChanges()
  })
  it('Changes to alternative contact are saved', () => {
    cy.login(TestUsers.PARTICIPANT_UNANSWERED.email)
    cy.visit('/profile/update')
    cy.get('[data-cy="update-nok-first"] input').clear()
    cy.get('[data-cy="update-nok-first"]').type('AAAB')
    cy.get('[data-cy="update-button"]').click()
    cy.get('[data-cy="profile-first"]').should('exist')
    cy.contains('AAAB').should('exist')
  })
  it('Invalid input gets correct error message', () => {
    cy.login(TestUsers.PARTICIPANT_UNANSWERED.email)
    cy.visit('/profile/update')
    cy.get('[data-cy="update-mobile"] input').clear()
    cy.get('[data-cy="update-mobile"]').type('0487654a')
    cy.get('[data-cy="update-button"]').click()
    cy.contains('Invalid mobile').should('exist')
  })

  it('Shows family members correctly', () => {
    cy.login(TestUsers.PARTICIPANT_UNANSWERED.email)
    cy.visit('/profile')
    cy.contains('Family').should('not.exist')
    cy.login(TestUsers.PARTICIPANT_COMPLETED.email)
    cy.visit('/profile')
    cy.contains('Family').should('exist')
    cy.contains('Test Dependent').should('exist')
    cy.contains('Dependent child').should('exist')
  })

  it('Does not allow participant to change their own email address', () => {
    cy.login(TestUsers.PARTICIPANT_UNANSWERED.email)
    cy.visit('/profile/update')
    // Wait for data to load
    cy.get('[data-cy="update-nok-first"]', { timeout: 500 }).should('be.visible')
    cy.get('input, textarea, select').each(($el) => {
      expect($el.val()).to.not.include(TestUsers.PARTICIPANT_UNANSWERED.email)
    })
  })
})
