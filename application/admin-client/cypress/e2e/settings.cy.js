/// <reference types="cypress" />

const { UserType } = require('../support/commands')

beforeEach(() => {
  cy.task('reset')
})

describe('Settings page', () => {
  const fieldMap = {
    mailerHost: 'host.com',
    mailerPort: '123',
    mailerUser: 'userx',
    mailerPassword: 'passwordx',
    primaryColour: 'red',
    secondaryColour: 'blue',
    redcapURL: 'http://redcap.com',
    redcapToken: 'APITOKENREDCAP',
  }

  it('Can edit settings and save them', () => {
    cy.login(UserType.ADMIN)
    cy.visit('/settings')

    cy.get('[data-cy="mailerHost"] input').should('have.value', 'smtp.ethereal.email')

    for (const [key, value] of Object.entries(fieldMap)) {
      cy.get(`[data-cy="${key}"] input`).clear().type(value)
    }
    cy.get('[data-cy="save-button"]').click()
    cy.visit('/settings')

    for (const [key, value] of Object.entries(fieldMap)) {
      cy.get(`[data-cy="${key}"] input`).should('have.value', value)
    }
  })

  it('Can reset settings', () => {
    cy.login(UserType.ADMIN)
    cy.visit('/settings')

    cy.get('[data-cy="mailerHost"] input').should('have.value', 'smtp.ethereal.email')

    for (const [key, value] of Object.entries(fieldMap)) {
      cy.get(`[data-cy="${key}"] input`).clear().type(value)
    }

    cy.get('[data-cy="discard-button"]').click()

    cy.get('[data-cy="mailerHost"] input').should('have.value', 'smtp.ethereal.email')
  })

  it('Invalid values prevent saving and show appropriate error messages', () => {
    const values = { ...fieldMap, redcapURL: 'abc', primaryColour: 'abc' }

    cy.login(UserType.ADMIN)
    cy.visit('/settings')

    cy.get('[data-cy="mailerHost"] input').should('have.value', 'smtp.ethereal.email')

    for (const [key, value] of Object.entries(values)) {
      cy.get(`[data-cy="${key}"] input`).clear().type(value)
    }
    cy.get('[data-cy="save-button"]').click()

    cy.contains('Invalid colour').should('exist')
    cy.contains('Invalid url').should('exist')

    for (const [key, value] of Object.entries(fieldMap)) {
      cy.get(`[data-cy="${key}"] input`).clear().type(value)
    }

    cy.contains('Invalid colour').should('not.exist')
    cy.contains('Invalid url').should('not.exist')
  })

  it('Attempting to invite participants while email is not set up shows error message', () => {
    cy.login(UserType.ADMIN)
    cy.visit('/settings')

    cy.get('[data-cy="mailerHost"] input').should('have.value', 'smtp.ethereal.email')

    cy.get('[data-cy="mailerHost"] input').clear()
    cy.get('[data-cy="save-button"]').click()

    cy.visit('/participants')
    cy.get('[data-cy="invite-button"]').click()

    cy.contains('You need to set up your email').should('exist')
    cy.contains('Go to').click()

    cy.url().should('contain', '/settings')
  })

  it('Redcap import page does not allow API features if not set up', () => {
    cy.login(UserType.ADMIN)
    cy.visit('/settings')

    cy.get('[data-cy="mailerHost"] input').should('have.value', 'smtp.ethereal.email')

    cy.get('[data-cy="redcapURL"] input').clear()
    cy.get('[data-cy="save-button"]').click()

    cy.visit('/integrations/redcap/survey/import')
    cy.contains('Redcap API is not set up').should('exist')
    cy.contains('Redcap settings').click()
    cy.url().should('contain', '/settings#redcap')
  })

  it('Can update logo', () => {
    cy.login(UserType.ADMIN)
    cy.visit('/settings')
    cy.get('[data-cy="logo-upload"]').attachFile('valid_logo.png')
    cy.contains('Updated logo').should('exist')
    cy.get('[data-cy="logo-preview"]').invoke('prop', 'naturalWidth').should('be.greaterThan', 0)
    cy.get('[data-cy="logo-preview"]').invoke('prop', 'naturalHeight').should('equal', 85)
  })

  it('Invalid logo fails to update', () => {
    cy.login(UserType.ADMIN)
    cy.visit('/settings')
    cy.get('[data-cy="logo-upload"]').attachFile('invalid_logo.png')
    cy.contains('Failed').should('exist')
    cy.get('[data-cy="logo-preview"]').invoke('prop', 'naturalWidth').should('be.greaterThan', 0)
    cy.get('[data-cy="logo-preview"]').invoke('prop', 'naturalHeight').should('equal', 100)
  })
})
