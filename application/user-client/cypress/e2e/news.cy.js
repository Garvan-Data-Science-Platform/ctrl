/// <reference types="cypress" />

const { TestUsers } = require('../../../common/testing/constants')

const stubNewsLink = (newsLink) =>
  cy.intercept('GET', '**/settings/userportal', {
    statusCode: 200,
    body: { data: { primaryColour: '#2196f3', secondaryColour: '#2196f3', newsLink } },
  })

// A news link the portal can't frame behaves like no link: News leaves the menu and /news goes home.
const expectNewsHidden = () => {
  cy.visit('/')
  cy.contains('Glossary').should('be.visible')
  cy.contains('News and Information').should('not.exist')
  cy.visit('/news')
  cy.location('pathname').should('eq', '/')
}

beforeEach(() => {
  cy.task('reset')
  cy.login(TestUsers.PARTICIPANT_UNANSWERED.email)
})

describe('news', () => {
  it('hides news when the link is a missing portal page', () => {
    stubNewsLink(`${Cypress.config('baseUrl')}/this-page-does-not-exist`)
    expectNewsHidden()
  })

  it('hides news when the link is a working portal page', () => {
    stubNewsLink(`${Cypress.config('baseUrl')}/glossary`)
    expectNewsHidden()
  })

  it('hides news when the link has no scheme', () => {
    // The browser resolves a scheme-less value as a path on the portal.
    stubNewsLink('news.example.com')
    expectNewsHidden()
  })

  it('shows an external news link in the page', () => {
    stubNewsLink('https://example.com')
    cy.visit('/')
    cy.contains('News and Information').should('be.visible')
    cy.visit('/news')
    cy.get('iframe').should('have.attr', 'src', 'https://example.com')
  })
})
