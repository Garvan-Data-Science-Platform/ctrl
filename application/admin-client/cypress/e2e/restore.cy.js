/// <reference types="cypress" />

const { UserType } = require('../../../common/cypress/support/commands')

beforeEach(() => {
  cy.task('reset')
})

describe('Delete and restore', () => {
  it('Organisation Admins should be able to delete a user then restore the user', () => {
    cy.login(UserType.ORG_ADMIN)
    cy.visit(`/users/101`)
    cy.contains('Delete').click()
    cy.contains('Are you sure').parent().contains('Delete').click()
    cy.contains('Success').should('exist')
    cy.contains('testOrgAdmin2@example.com').should('not.exist')

    cy.visit(`/users/106`)
    cy.contains('Delete').click()
    cy.contains('Are you sure').parent().contains('Delete').click()
    cy.contains('Success').should('exist')
    cy.contains('studyadmin@example.com').should('not.exist')

    cy.visit('/restore')
    cy.contains('101').should('exist')
    cy.get('[data-cy="restore-user"]').eq(0).click()
    cy.contains('Successfully restored').should('exist')
    cy.contains('101').should('not.exist')

    cy.contains('106').should('exist')
    cy.get('[data-cy="restore-user"]').eq(0).click()
    cy.contains('Successfully restored').should('exist')
    cy.contains('106').should('not.exist')

    cy.visit('/users')
    cy.contains('testOrgAdmin2@example.com').should('exist')
  })

  it('Organisation Admins should be able to delete a study then restore the study', () => {
    cy.login(UserType.ORG_ADMIN)
    cy.visit('/studies')
    cy.get('[data-cy="delete-study"]').first().click()
    cy.get('[data-cy="confirm-delete"]').click()
    cy.contains('Test Study').should('not.exist')
    cy.visit('/restore')
    cy.contains('Test Study').should('exist')
    cy.get('[data-cy="restore-study"]').click()
    cy.contains('Successfully restored').should('exist')
    cy.contains('Test Study').should('not.exist')
    cy.visit('/studies')
    cy.contains('Test Study').should('exist')
  })

  it('Organisation Admins should be able to delete a participant then restore the participant', () => {
    cy.login(UserType.ORG_ADMIN)
    cy.visit('/participants/98')
    cy.contains('Delete').click()
    cy.contains('Are you sure').parent().contains('Delete').click()
    cy.contains('Success').should('exist')
    cy.contains('Unanswered').should('not.exist')
    cy.visit('/restore')
    cy.contains('Unanswered').should('exist')
    cy.get('[data-cy="restore-participant"]').click()
    cy.contains('Successfully restored').should('exist')
    cy.contains('Unanswered').should('not.exist')
    cy.visit('/participants')
    cy.contains('Unanswered').should('exist')
  })

  it('Study Admins should be able to delete a study that they are admins of and restore the study', () => {
    cy.login(UserType.STUDY_ADMIN)

    // Create two new studies
    cy.visit('/studies')
    cy.get('[data-cy="new-study-button"]').click()
    cy.get('[data-cy="study-create"]').click()
    cy.get('[data-cy="study-name"] input').should('be.focused').type('New Study 1')
    cy.get('[data-cy="study-create"]').click()
    cy.get('[data-cy="study-create"]').should('not.exist')
    cy.contains('New Study 1').should('exist')

    cy.visit('/studies')
    cy.get('[data-cy="new-study-button"]').click()
    cy.get('[data-cy="study-create"]').click()
    cy.get('[data-cy="study-name"] input').should('be.focused').type('New Study 2')
    cy.get('[data-cy="study-create"]').click()
    cy.get('[data-cy="study-create"]').should('not.exist')
    cy.contains('New Study 2').should('exist')

    // Delete study 1
    cy.visit('/studies')
    cy.get('[data-cy="delete-study"]').eq(1).click()
    cy.get('[data-cy="confirm-delete"]').click()
    cy.contains('New Study 1').should('not.exist')

    // Restore study 1
    cy.visit('/restore')
    cy.contains('New Study 1').should('exist')
    cy.get('[data-cy="restore-study"]').click()
    cy.contains('Successfully restored').should('exist')
    cy.contains('New Study 1').should('not.exist')
    cy.visit('/studies')
    cy.contains('New Study 1').should('exist')
  })
})
