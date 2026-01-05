/// <reference types="cypress" />

const { UserType } = require('../support/commands')

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
})
