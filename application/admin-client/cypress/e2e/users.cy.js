/// <reference types="cypress" />

const { TestUsers } = require('../../../common/testing/constants')
const { VALIDATION_MESSAGES } = require('../../../common/src/validation')

beforeEach(() => {
  cy.task('reset')
  cy.login(TestUsers.ORG_ADMIN.email)
})

describe('Users', () => {
  it('List users', () => {
    cy.visit('/users')
    cy.contains('Users').should('exist')
  })

  it('View single user', () => {
    cy.visit('/users')
    cy.get('[data-cy="view-button"]').first().click()
    cy.contains('First Name').should('exist')
  })
  it('Create user, check validation of email', () => {
    cy.visit('/users')
    cy.contains('Create').click()
    cy.url().should('contain', '/users/create')
    cy.get('[data-cy="create-first"]').type('Elvis')
    cy.get('input').eq(1).type('Presley')
    cy.get('input').eq(2).type('elvisexample.com')
    cy.contains('Save').click()
    cy.contains(VALIDATION_MESSAGES.EMAIL_INVALID).should('exist')
    cy.get('input').eq(2).clear().type('elvis@example.com')
    cy.contains('Save').click()
    cy.contains('Created at').should('exist')
    cy.contains('elvis@example.com').should('exist')
  })
  it('Edit user, check validation of email', () => {
    cy.visit('/users')
    cy.get('[data-cy="edit-button"]').eq(1).click()
    cy.get('input').eq(0).type('A')
    cy.get('input').eq(2).clear().type('elvisexample.com')
    cy.contains('Save').click()
    cy.contains(VALIDATION_MESSAGES.EMAIL_INVALID).should('exist')
    cy.get('input').eq(2).clear().type('elvis@example.com')
    cy.contains('Save').click()
    cy.contains('Success').should('exist')
    cy.visit('/users')
    cy.contains('OrganisationA').should('exist')
  })
  it('Create user, check validation of xss firstname input', () => {
    cy.visit('/users')
    cy.contains('Create').click()
    cy.url().should('contain', '/users/create')
    cy.get('[data-cy="create-first"]').type("{{7*7}}<script>alert('xss-first-name')</script>", {
      parseSpecialCharSequences: false,
    })
    cy.get('input').eq(1).type('Presley')
    cy.get('input').eq(2).type('elvis@example.com')
    cy.contains('Save').click()
    cy.contains(VALIDATION_MESSAGES.NAME_INVALID).should('exist')
  })
  it('Create user, check validation of xss lastname input', () => {
    cy.visit('/users')
    cy.contains('Create').click()
    cy.url().should('contain', '/users/create')
    cy.get('[data-cy="create-first"]').type('Elvis')
    cy.get('input').eq(1).type("{{7*7}}<script>alert('xss-last-name')</script>", {
      parseSpecialCharSequences: false,
    })
    cy.get('input').eq(2).type('elvis@example.com')
    cy.contains('Save').click()
    cy.contains(VALIDATION_MESSAGES.NAME_INVALID).should('exist')
  })
  it('Create user, check validation of xss email input', () => {
    cy.visit('/users')
    cy.contains('Create').click()
    cy.url().should('contain', '/users/create')
    cy.get('[data-cy="create-first"]').type('Elvis')
    cy.get('input').eq(1).type('Presley')
    cy.get('input').eq(2).type("{{7*7}}<script>alert('xss-email')</script>@gmail.com", {
      parseSpecialCharSequences: false,
    })
    cy.contains('Save').click()
    cy.contains(VALIDATION_MESSAGES.EMAIL_INVALID).should('exist')
  })
  it('Edit user, check validation of xss firstname input', () => {
    cy.visit('/users')
    cy.get('[data-cy="edit-button"]').eq(1).click()
    cy.get('input').eq(0).type("{{7*7}}<script>alert('xss-first-name')</script>", {
      parseSpecialCharSequences: false,
    })
    cy.contains('Save').click()
    cy.contains(VALIDATION_MESSAGES.NAME_INVALID).should('exist')
  })
  it('Edit user, check validation of xss lastname input', () => {
    cy.visit('/users')
    cy.get('[data-cy="edit-button"]').eq(1).click()
    cy.get('input').eq(1).type("{{7*7}}<script>alert('xss-last-name')</script>", {
      parseSpecialCharSequences: false,
    })
    cy.contains('Save').click()
    cy.contains(VALIDATION_MESSAGES.NAME_INVALID).should('exist')
  })
  it('Edit user, check validation of xss email input', () => {
    cy.visit('/users')
    cy.get('[data-cy="edit-button"]').eq(1).click()
    cy.get('input').eq(0).type('A')
    cy.get('input').eq(2).clear().type("{{7*7}}<script>alert('xss-email')</script>@gmail.com", {
      parseSpecialCharSequences: false,
    })
    cy.contains('Save').click()
    cy.contains(VALIDATION_MESSAGES.EMAIL_INVALID).should('exist')
  })
})
