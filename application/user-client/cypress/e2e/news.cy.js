/// <reference types="cypress" />

const { TestUsers } = require('../../../common/testing/constants')

const stubNewsLink = (newsLink) =>
  cy.intercept('GET', '**/settings/userportal', {
    statusCode: 200,
    body: { data: { primaryColour: '#2196f3', secondaryColour: '#2196f3', newsLink } },
  })

beforeEach(() => {
  cy.task('reset')
  cy.login(TestUsers.PARTICIPANT_UNANSWERED.email)
})

describe('news', () => {
  it('does not show the portal inside its own news page', () => {
    stubNewsLink(`${Cypress.config('baseUrl')}/this-page-does-not-exist`)
    cy.visit('/news')
    cy.get('[data-cy="news-unavailable"]').should('be.visible')
    cy.get('iframe').should('not.exist')
  })

  it('shows an external news link in the page', () => {
    stubNewsLink('https://example.com')
    cy.visit('/news')
    cy.get('iframe').should('have.attr', 'src', 'https://example.com')
    cy.get('[data-cy="news-unavailable"]').should('not.exist')
  })
})
