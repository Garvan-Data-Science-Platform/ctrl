/// <reference types="cypress" />

const { UserType } = require('../support/commands')

describe('basic', () => {
  it('renders homepage', () => {
    cy.visit('/')
    cy.contains('Log In').should('exist')
  })
  it('can navigate to tabs', () => {
    cy.login(UserType.PARTICIPANT_UNANSWERED)
    cy.visit('/')
    cy.contains('Welcome').should('exist')
    cy.contains('My Personal').click()
    cy.contains('Update').should('exist')
    cy.contains('Contact').click()
    cy.contains('message').should('exist')
    cy.contains('News').click()
    cy.get('iframe').should('exist')
    cy.contains('Glossary').click()
    cy.contains('DNA').should('exist')
  })
  it('can navigate in mobile view', () => {
    cy.viewport('iphone-8')
    cy.login(UserType.PARTICIPANT_UNANSWERED)
    cy.visit('/')
    cy.get('[data-cy="hamburger"]').click()
    cy.get('ul li').eq(2).click()
    cy.contains('message').should('exist')
  })
})
