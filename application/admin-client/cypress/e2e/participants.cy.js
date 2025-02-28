/// <reference types="cypress" />

const { UserType } = require('../support/commands')

beforeEach(() => {
  cy.task('reset')
})

describe('Participants', () => {
  it('List participants', () => {
    cy.login(UserType.ADMIN)
    cy.visit('/participants')
    cy.contains('Test').should('exist')
    cy.contains('Dependent').should('exist')
    cy.contains('V1').should('exist')
  })
  it('View participant details', () => {
    cy.login(UserType.ADMIN)
    cy.visit('/participants/98')
    cy.contains('Test User').should('exist')
    cy.contains('123 smith st').should('exist')
    cy.contains('V1').should('exist')
    cy.contains('Family').should('not.exist')
    cy.visit('/participants/99')
    cy.contains('Family').should('exist')
    cy.contains('Dependent').should('exist')
  })

  it('Edit participant details', () => {
    cy.login(UserType.ADMIN)
    cy.visit('/participants/98')
    cy.contains('Test User').should('exist')
    cy.contains('123 smith st').should('exist')
    cy.contains('V1').should('exist')
    cy.contains('Family').should('not.exist')
    cy.visit('/participants/99')
    cy.contains('Family').should('exist')
    cy.contains('Dependent').should('exist')
  })

  it('View answers', () => {
    cy.login(UserType.ADMIN)
    cy.visit('/participants')
    cy.get('[data-rowindex="0"]').contains('V1').trigger('mouseover', { force: true })
    cy.contains('Incomplete').should('be.visible')
    cy.get('[data-rowindex="1"]').contains('V1').trigger('mouseover', { force: true })
    cy.contains('Complete').should('be.visible')
    cy.get('[data-rowindex="1"]').contains('V1').click({ force: true })
  })

  it('Shows completed and partially completed surveys', () => {
    cy.login(UserType.ADMIN)
    cy.visit('/participants')
    cy.get('[data-rowindex="0"]').contains('V1').trigger('mouseover', { force: true })
    cy.contains('Incomplete').should('be.visible')
    cy.task('partialComplete')
    cy.visit('/participants')
    cy.get('[data-rowindex="2"]').contains('V1').trigger('mouseover', { force: true })
    cy.contains('Partially Complete').should('be.visible')
  })

  it('Can view responses', () => {
    //Note yet implemented
  })
})
