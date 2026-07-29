/// <reference types="cypress" />

const { TestUsers, TestStudies } = require('../../../common/testing/constants')

beforeEach(() => {
  cy.task('reset')
})

describe('Delete and restore', () => {
  it('Organisation Admins should be able to delete a user then restore the user', () => {
    cy.login(TestUsers.ORG_ADMIN.email)
    cy.visit(`/users/${TestUsers.ORG_ADMIN_2.id}`)
    cy.contains('Delete').click()
    cy.contains('Are you sure').parent().contains('Delete').click()
    cy.contains('Success').should('exist')
    cy.contains(TestUsers.ORG_ADMIN_2.email).should('not.exist')

    cy.visit(`/users/${TestUsers.STUDY_ADMIN.id}`)
    cy.contains('Delete').click()
    cy.contains('Are you sure').parent().contains('Delete').click()
    cy.contains('Success').should('exist')
    cy.contains(TestUsers.STUDY_ADMIN.email).should('not.exist')

    cy.visit('/restore')
    cy.contains(TestUsers.ORG_ADMIN_2.id).should('exist')
    cy.get('[data-cy="restore-user"]').eq(0).click()
    cy.contains('Successfully restored').should('exist')
    cy.contains(TestUsers.ORG_ADMIN_2.id).should('not.exist')

    cy.contains(TestUsers.STUDY_ADMIN.id).should('exist')
    cy.get('[data-cy="restore-user"]').eq(0).click()
    cy.contains('Successfully restored').should('exist')
    cy.contains(TestUsers.STUDY_ADMIN.id).should('not.exist')

    cy.visit('/users')
    cy.contains(TestUsers.ORG_ADMIN_2.email).should('exist')
  })

  it('Organisation Admins should be able to delete a study then restore the study', () => {
    cy.login(TestUsers.ORG_ADMIN.email)
    cy.visit('/studies')
    cy.get('[data-cy="delete-study"]').first().click()
    cy.get('[data-cy="confirm-delete"]').click()
    cy.contains(TestStudies.TEST_STUDY.name).should('not.exist')
    cy.visit('/restore')
    cy.contains(TestStudies.TEST_STUDY.name).should('exist')
    cy.get('[data-cy="restore-study"]').click()
    cy.contains('Successfully restored').should('exist')
    cy.contains(TestStudies.TEST_STUDY.name).should('not.exist')
    cy.visit('/studies')
    cy.contains(TestStudies.TEST_STUDY.name).should('exist')
  })

  it('Organisation Admins should be able to delete a participant then restore the participant', () => {
    cy.login(TestUsers.ORG_ADMIN.email)
    cy.visit(`/participants/${TestUsers.PARTICIPANT_UNANSWERED.id}`)
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
    cy.login(TestUsers.STUDY_ADMIN.email)
    // Create two new studies
    const study1 = 'New Study 1'
    const study2 = 'New Study 2'
    cy.visit('/studies')
    cy.get('[data-cy="new-study-button"]').click()
    cy.get('[data-cy="study-create"]').click()
    cy.get('[data-cy="study-name"] input').should('be.focused').type(study1)
    cy.get('[data-cy="study-create"]').click()
    cy.get('[data-cy="study-create"]').should('not.exist')
    cy.contains(study1).should('exist')

    cy.visit('/studies')
    cy.get('[data-cy="new-study-button"]').click()
    cy.get('[data-cy="study-create"]').click()
    cy.get('[data-cy="study-name"] input').should('be.focused').type(study2)
    cy.get('[data-cy="study-create"]').click()
    cy.get('[data-cy="study-create"]').should('not.exist')
    cy.contains(study2).should('exist')

    // Delete study 1
    cy.visit('/studies')
    cy.get('[data-cy="delete-study"]').eq(1).click()
    cy.get('[data-cy="confirm-delete"]').click()
    cy.contains(study1).should('not.exist')

    // Restore study 1
    cy.visit('/restore')
    cy.contains(study1).should('exist')
    cy.get('[data-cy="restore-study"]').click()
    cy.contains('Successfully restored').should('exist')
    cy.contains(study1).should('not.exist')
    cy.visit('/studies')
    cy.contains(study1).should('exist')
  })
})
