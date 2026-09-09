/// <reference types="cypress" />
const { TestUsers } = require('../../../common/testing/constants')
const { VALIDATION_MESSAGES } = require('../../../common/src/validation')

describe('Setup', () => {
  it('Redirects to setup page if database empty, can register', () => {
    cy.task('wipe')
    cy.visit('/')
    cy.url().should('contain', '/setup')
    cy.get('[data-cy="setup-email"]').type('abc@d.com')
    cy.get('[data-cy="setup-password"]').type(TestUsers.ORG_ADMIN.password) // Using test data to conform to pr requirements
    cy.get('[data-cy="setup-submit"]').click()
    cy.url().should('contain', '/surveys')
    cy.visit('/surveys')
    cy.contains('Current Draft').should('exist')
  })

  it('Cannot register with xss', () => {
    cy.task('wipe')
    cy.visit('/')
    cy.url().should('contain', '/setup')
    cy.get('[data-cy="setup-email"]').type(
      "{{7*7}}<script>alert('xss-dep-first')</script>@gmail.com",
      {
        parseSpecialCharSequences: false,
      },
    )
    cy.get('[data-cy="setup-password"]').type(TestUsers.ORG_ADMIN.password) // Using test data to conform to pr requirements
    cy.get('[data-cy="setup-submit"]').click()
    cy.contains(VALIDATION_MESSAGES.EMAIL_INVALID).should('exist')
  })

  it('Cannot register with weak password', () => {
    cy.task('wipe')
    cy.visit('/')
    cy.url().should('contain', '/setup')
    cy.get('[data-cy="setup-email"]').type('abc@d.com')
    cy.get('[data-cy="setup-password"]').type('password')
    cy.get('[data-cy="setup-submit"]').click()
    cy.contains('Invalid password').should('exist')
  })
})
