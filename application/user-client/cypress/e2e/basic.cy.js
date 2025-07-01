/// <reference types="cypress" />

const { UserType } = require('../support/commands')

beforeEach(() => {
  cy.task('reset')
})

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
    cy.get('ul li').eq(2).click({ force: true })
    cy.contains('message').should('exist')
  })

  it('can load style from backend', () => {
    cy.login(UserType.PARTICIPANT_UNANSWERED)
    cy.visit('/')
    cy.intercept('GET', '**/settings/theme', {
      statusCode: 200,
      body: { data: { primaryColour: 'rgb(1,2,3)', secondaryColor: 'rgb(3,2,1)' } },
    }).as('settings')

    cy.get('[data-cy="step-button-0"]')
      .should('have.css', 'background-color')
      .and('equal', 'rgb(1, 2, 3)')
  })

  it('can load logo from backend', () => {
    cy.login(UserType.PARTICIPANT_UNANSWERED)
    cy.visit('/')
    cy.get('[data-cy="logo"]').invoke('prop', 'naturalWidth').should('be.greaterThan', 0)
    cy.get('[data-cy="logo"]').invoke('prop', 'naturalHeight').should('equal', 100)
    cy.task('updateLogo', 'cypress/fixtures/valid_logo.png')
    cy.visit('/')
    cy.get('[data-cy="logo"]').invoke('prop', 'naturalWidth').should('be.greaterThan', 0)
    cy.get('[data-cy="logo"]').invoke('prop', 'naturalHeight').should('equal', 93)
  })

  it('Is redirected to login when attempting to use expired token', () => {
    cy.login(UserType.PARTICIPANT_UNANSWERED)
    cy.visit('/')
    cy.contains('Welcome').should('exist')
    cy.login_expired()
    cy.visit('/')
    cy.get('[data-cy="login"]').should('exist')
  })
  it('Can log out', () => {
    cy.login(UserType.PARTICIPANT_UNANSWERED)
    cy.visit('/')
    cy.get('[data-cy="log-out"]').click()
    cy.url().should('contain', '/login')
    cy.visit('/')
    cy.url().should('contain', '/login')
  })
})
