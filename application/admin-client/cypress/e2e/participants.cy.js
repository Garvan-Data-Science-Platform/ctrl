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
  it('View and edit participant details', () => {
    throw Error('Not implemented')
  })
  it('View answers', () => {})
  it('New survey version shows', () => {})

  it('Shows completed and partially completed surveys', () => {})

  it('Can view responses', () => {})
})
