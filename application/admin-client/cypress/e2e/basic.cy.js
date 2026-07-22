/// <reference types="cypress" />

const { TestUsers } = require('../../../common/testing/constants')

beforeEach(() => {
  cy.task('reset')
})

describe('basic', () => {
  it('renders homepage, can login', () => {
    cy.visit('/')
    cy.contains('Sign in to your account').should('exist')
  })
  it('can navigate to tabs', () => {
    cy.login(TestUsers.ORG_ADMIN.email)
    cy.visit('/users')
    cy.contains('Surveys').click()
    cy.url().should('contain', '/surveys')
    cy.contains('Participants').click()
    cy.url().should('contain', '/participants')
  })
  it('Sidebar hide and show', () => {
    cy.login(TestUsers.ORG_ADMIN.email)
    cy.visit('/users')
    cy.get('button[tabindex="0"]').first().click()
    cy.contains('CTRL Admin').should('not.be.visible')
    cy.get('button[tabindex="0"]').first().click()
    cy.contains('CTRL Admin').should('be.visible')
  })

  it('Is redirected to login when attempting to use expired token', () => {
    cy.login(TestUsers.ORG_ADMIN.email)
    cy.visit('/users')
    cy.contains('OrganisationAdmin').should('exist')
    cy.login_expired()
    cy.visit('/surveys')
    cy.contains('Sign in', { timeout: 20000 }).should('exist')
  })
})
