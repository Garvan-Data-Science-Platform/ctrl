/// <reference types="cypress" />

const { UserType } = require('../support/commands')

beforeEach(() => {
  cy.task('reset')
})

describe('Delete and restore', () => {
  it('Delete and restore user', () => {
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

  it('Delete and restore study', () => {
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

  it('Delete and restore participant', () => {
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
})
