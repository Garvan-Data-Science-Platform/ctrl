/// <reference types="cypress" />

const { UserType } = require('../support/commands')

beforeEach(() => {
  cy.task('reset')
  cy.login(UserType.ORG_ADMIN)
})

describe('Study management page', () => {
  it('Can access study management page', () => {
    cy.visit('/users')
    cy.get('[data-cy="manage-studies"]').click()
    cy.url().should('contain', '/studies')
  })

  it('Can create a new study', () => {
    cy.visit('/studies')
    cy.get('[data-cy="new-study-button"]').click()
    cy.get('[data-cy="study-create"]').click()
    cy.get('[data-cy="study-name"] input').should('be.focused').type('TEST')
    cy.get('[data-cy="study-create"]').click()
    cy.get('[data-cy="study-create"]').should('not.exist')
    cy.contains('TEST').should('exist')
  })

  it('Can edit study name', () => {
    cy.visit('/studies')
    cy.get('[data-cy="edit-name-field"]').should('not.exist')
    cy.get('[data-cy="edit-name"]').eq(1).click()
    cy.get('[data-cy="edit-name-field"] input').clear().type('NEW NAME')
    cy.contains('Save').click()
    cy.contains('NEW NAME').should('exist')
    cy.reload()
    cy.contains('NEW NAME').should('exist')
  })

  it('Can edit study description', () => {
    cy.visit('/studies')
    cy.get('[data-cy="edit-description-field"]').should('not.exist')
    cy.get('[data-cy="edit-description"]').eq(1).click()
    cy.get('[data-cy="edit-description-field"]').type('STUDY DESCRIPTION')
    cy.contains('Save').click()
    cy.contains('STUDY DESCRIPTION').should('exist')
    cy.reload()
    cy.contains('STUDY DESCRIPTION').should('exist')
  })

  it('Can edit redcap settings', () => {
    cy.visit('/studies')
    cy.get('[data-cy="advanced-toggle"]').eq(1).click()
    cy.get('[data-cy="redcapURL"] input').eq(1).type('abc')
    cy.get('[data-cy="redcapToken"] input').eq(1).type('abc123')
    cy.get('[data-cy="redcap-apply"]').eq(1).click()
    cy.contains('Invalid Redcap').should('exist')
    cy.get('[data-cy="redcapURL"] input').eq(1).clear().type('https://abc.com')
    cy.get('[data-cy="redcap-apply"]').eq(1).click()
    cy.contains('Updated').should('exist')
  })

  it('Cannot give study same name as existing study', () => {
    cy.visit('/studies')
    cy.get('[data-cy="edit-name-field"]').should('not.exist')
    cy.get('[data-cy="edit-name"]').eq(1).click()
    cy.get('[data-cy="edit-name-field"] input').clear().type('Test Study')
    cy.contains('Save').click()
    cy.contains('Study with that name already exists').should('exist')
  })

  it('Redcap import page does not allow API features if not set up', () => {
    cy.login(UserType.ORG_ADMIN)
    cy.visit('/integrations/redcap/survey/import')
    cy.get('[data-cy="study-dropdown"]').click()
    cy.contains('Study 2').click()
    cy.contains('Redcap API is not set up').should('exist')
    cy.contains('Redcap settings').click()
    cy.contains('Redcap API URL').should('exist')
  })

  it('Can delete a study', () => {
    cy.visit('/studies')
    //Change to last study to test behaviour when last study in list is active and deleted
    cy.get('[data-cy="delete-study"]').should('have.length', 4).eq(2).click()
    cy.get('[data-cy="confirm-delete"]').click()
    cy.get('[data-cy="delete-study"]').should('have.length', 3)
    cy.reload()
    cy.get('[data-cy="delete-study"]').should('have.length', 3)
    cy.contains('Empty Study').should('exist')
    cy.get('[data-cy="delete-study"]').should('have.length', 3).eq(0).click()
    cy.get('[data-cy="confirm-delete"]').click()
    cy.get('[data-cy="delete-study"]').should('have.length', 2).eq(0).click()
    cy.get('[data-cy="confirm-delete"]').click()
    cy.get('[data-cy="delete-study"]').should('have.length', 1).eq(0).should('be.disabled')
  })

  it('Can upload a study logo', () => {
    cy.login(UserType.ORG_ADMIN)
    cy.visit('/studies')
    cy.get('[data-cy="logo-upload"]').attachFile('valid_logo.png')
    cy.contains('Updated logo').should('exist')
    cy.get('[data-cy="logo-preview"]').invoke('prop', 'naturalWidth').should('be.greaterThan', 0)
    cy.get('[data-cy="logo-preview"]').invoke('prop', 'naturalHeight').should('equal', 85)
  })
})
