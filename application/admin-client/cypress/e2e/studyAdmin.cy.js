/// <reference types="cypress" />

const { UserType } = require('../../../common/cypress/support/commands')

beforeEach(() => {
  cy.task('reset')
})

describe('Study Admins', () => {
  it('Add and remove studyadmin from studies', () => {
    cy.login(UserType.ORG_ADMIN)
    cy.visit('/users')
    cy.get('[data-cy="edit-button"]').eq(3).click()
    cy.contains('Study 2').click()
    cy.contains('Added').should('exist')
    cy.contains('Study 2').click()
    cy.contains('Removed').should('exist')
  })

  it('Restricted functionality for study admin users', () => {
    cy.login(UserType.STUDY_ADMIN)
    cy.visit('/users')
    //Can't see or visit Settings page
    cy.contains('Settings').should('not.exist')
    //Can't edit their own role
    cy.visit('/users/update/106')
    cy.get('[data-cy="role-select"] input').should('be.disabled')
    cy.get('[data-cy="first"] input').should('not.be.disabled')
    //Can't edit another admin
    cy.visit('/users/update/97')
    cy.get('[data-cy="role-select"] input').should('be.disabled')
    cy.get('[data-cy="first"] input').should('be.disabled')
    //Can't delete another admin
    cy.visit('/users/update/97')
    cy.contains('Delete').should('not.exist')
  })
  it('Study admin checkboxes not visible when editing an org admin', () => {
    cy.visit('/users/update/97')
    cy.contains('Admin of Study').should('not.exist')
  })
  it('Can only see studies they are admin of', () => {
    cy.login(UserType.STUDY_ADMIN)
    cy.visit('/studies')
    cy.contains('Study FE').should('not.exist')
    cy.contains('Test Study').should('exist')
  })
  it('Cannot edit a family if they are not admin of every related study', () => {
    cy.login(UserType.STUDY_ADMIN)
    cy.visit('/participants/family/edit/100')
    cy.get('[data-cy="remove-member-button"]').click()
    cy.get('[data-cy="remove-icon-button"]').eq(1).click()
    cy.contains('Failed to remove').should('exist')
  })
  it("Displays correct message when a study admin logs in but they don't have access to any studies", () => {
    cy.login(UserType.ORG_ADMIN)
    cy.visit('/users')
    cy.get('[data-cy="edit-button"]').eq(3).click()
    cy.contains('Test Study').click()
    cy.contains('Removed').should('exist')
    cy.login(UserType.STUDY_ADMIN)
    cy.visit('/users')
    cy.contains('You do not have access').should('exist')
  })

  it('Study admin can create a study and gets added to it', () => {
    cy.login(UserType.STUDY_ADMIN)
    cy.visit('/studies')
    cy.get('[data-cy="new-study-button"]').click()
    cy.get('[data-cy="study-create"]').click()
    cy.get('[data-cy="study-name"] input').should('be.focused').type('STUDY X')
    cy.get('[data-cy="study-create"]').click()
    cy.get('[data-cy="study-create"]').should('not.exist')
    cy.contains('STUDY X').should('exist')
    cy.reload()
    cy.contains('STUDY X').should('exist')
  })
})
