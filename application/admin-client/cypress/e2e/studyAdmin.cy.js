/// <reference types="cypress" />

const { TestUsers, TestStudies } = require('../../../common/testing/constants')

beforeEach(() => {
  cy.task('reset')
})

describe('Study Admins', () => {
  it('Add and remove studyadmin from studies', () => {
    cy.login(TestUsers.ORG_ADMIN.email)
    cy.visit('/users')
    cy.get('[data-cy="edit-button"]').eq(3).click()
    cy.contains(TestStudies.TEST_STUDY_2.name).click()
    cy.contains('Added').should('exist')
    cy.contains(TestStudies.TEST_STUDY_2.name).click()
    cy.contains('Removed').should('exist')
  })

  it('Restricted functionality for study admin users', () => {
    cy.login(TestUsers.STUDY_ADMIN.email)
    cy.visit('/users')
    //Can't see or visit Settings page
    cy.contains('Settings').should('not.exist')
    //Can't edit their own role
    cy.visit(`/users/update/${TestUsers.STUDY_ADMIN.id}`)
    cy.get('[data-cy="role-select"] input').should('be.disabled')
    cy.get('[data-cy="first"] input').should('not.be.disabled')
    //Can't edit another admin
    cy.visit(`/users/update/${TestUsers.ORG_ADMIN}`)
    cy.get('[data-cy="role-select"] input').should('be.disabled')
    cy.get('[data-cy="first"] input').should('be.disabled')
    //Can't delete another admin
    cy.visit(`/users/update/${TestUsers.ORG_ADMIN.id}`)
    cy.contains('Delete').should('not.exist')
  })
  it('Study admin checkboxes not visible when editing an org admin', () => {
    cy.visit(`/users/update/${TestUsers.ORG_ADMIN.id}`)
    cy.contains('Admin of Study').should('not.exist')
  })
  it('Can only see studies they are admin of', () => {
    cy.login(TestUsers.STUDY_ADMIN.email)
    cy.visit('/studies')
    cy.contains(TestStudies.FE_TEST_STUDY.name).should('not.exist')
    cy.contains(TestStudies.TEST_STUDY.name).should('exist')
  })
  it('Cannot edit a family if they are not admin of every related study', () => {
    cy.login(TestUsers.STUDY_ADMIN.email)
    cy.visit('/participants/family/edit/100')
    cy.get('[data-cy="remove-member-button"]').click()
    cy.get('[data-cy="remove-icon-button"]').eq(1).click()
    cy.contains('Failed to remove').should('exist')
  })
  it("Displays correct message when a study admin logs in but they don't have access to any studies", () => {
    cy.login(TestUsers.ORG_ADMIN.email)
    cy.visit('/users')
    cy.get('[data-cy="edit-button"]').eq(3).click()
    cy.contains(TestStudies.TEST_STUDY.name).click()
    cy.contains('Removed').should('exist')
    cy.login(TestUsers.STUDY_ADMIN.email)
    cy.visit('/users')
    cy.contains('You do not have access').should('exist')
  })

  it('Study admin can create a study and gets added to it', () => {
    cy.login(TestUsers.STUDY_ADMIN.email)
    const newStudy = 'STUDY X'
    cy.visit('/studies')
    cy.get('[data-cy="new-study-button"]').click()
    cy.get('[data-cy="study-create"]').click()
    cy.get('[data-cy="study-name"] input').should('be.focused').type(newStudy)
    cy.get('[data-cy="study-create"]').click()
    cy.get('[data-cy="study-create"]').should('not.exist')
    cy.contains(newStudy).should('exist')
    cy.reload()
    cy.contains(newStudy).should('exist')
  })
})
