/// <reference types="cypress" />

const { UserType } = require('../support/commands')

beforeEach(() => {
  cy.task('reset')
})

describe('Settings page', () => {
  const fieldMap = {
    primaryColour: 'red',
    secondaryColour: 'blue',
  }

  it('Can edit settings and save them', () => {
    cy.login(UserType.ADMIN)
    cy.visit('/settings')

    cy.get('[data-cy="tcLink"] input').should(
      'have.value',
      'https://garvan-data-science-platform.github.io/ctrl-docs/docs/terms-and-conditions',
    )

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

    cy.get('[data-cy="tcLink"] input').should(
      'have.value',
      'https://garvan-data-science-platform.github.io/ctrl-docs/docs/terms-and-conditions',
    )

    for (const [key, value] of Object.entries(fieldMap)) {
      cy.get(`[data-cy="${key}"] input`).clear().type(value)
    }

    cy.get('[data-cy="discard-button"]').click()

    cy.get('[data-cy="tcLink"] input').should(
      'have.value',
      'https://garvan-data-science-platform.github.io/ctrl-docs/docs/terms-and-conditions',
    )
  })

  it('Invalid values prevent saving and show appropriate error messages', () => {
    const values = { ...fieldMap, primaryColour: 'abc' }

    cy.login(UserType.ADMIN)
    cy.visit('/settings')

    cy.get('[data-cy="tcLink"] input').should(
      'have.value',
      'https://garvan-data-science-platform.github.io/ctrl-docs/docs/terms-and-conditions',
    )

    for (const [key, value] of Object.entries(values)) {
      cy.get(`[data-cy="${key}"] input`).clear().type(value)
    }
    cy.get('[data-cy="save-button"]').click()

    cy.contains('Invalid colour').should('exist')

    for (const [key, value] of Object.entries(fieldMap)) {
      cy.get(`[data-cy="${key}"] input`).clear().type(value)
    }

    cy.contains('Invalid colour').should('not.exist')
  })

  it('Can upload an org logo', () => {
    cy.login(UserType.ADMIN)
    cy.visit('/settings')
    cy.get('[data-cy="logo-upload"]').attachFile('valid_logo.png')
    cy.contains('Updated logo').should('exist')
    cy.readFile('../common/testing/fixtures/logo_hashes.json').then((data) => {
      cy.get('[data-cy="logo-preview"]')
        .should('be.visible')
        .and('have.attr', 'src')
        .then((src) => {
          cy.request({ url: src, encoding: 'base64' }).then((response) => {
            cy.task('calculateHash', response.body).then((hash) => {
              expect(hash).to.equal(data.validLogoResizedHash)
            })
          })
        })
    })
  })

  it('Can update an org logo', () => {
    cy.login(UserType.ADMIN)
    cy.visit('/settings')
    // Upload original logo
    cy.get('[data-cy="logo-upload"]').attachFile('valid_logo.png')
    cy.contains('Updated logo').should('exist')
    cy.readFile('../common/testing/fixtures/logo_hashes.json').then((data) => {
      cy.get('[data-cy="logo-preview"]')
        .should('be.visible')
        .and('have.attr', 'src')
        .then((src) => {
          cy.request({ url: src, encoding: 'base64' }).then((response) => {
            cy.task('calculateHash', response.body).then((hash) => {
              expect(hash).to.equal(data.validLogoResizedHash)
            })
          })
        })
    })

    // Update logo to another image
    cy.get('[data-cy="logo-upload"]').attachFile('alternate_logo.png')
    cy.contains('Updated logo').should('exist')
    cy.readFile('../common/testing/fixtures/logo_hashes.json').then((data) => {
      cy.get('[data-cy="logo-preview"]')
        .should('be.visible')
        .and('have.attr', 'src')
        .then((src) => {
          cy.request({ url: src, encoding: 'base64' }).then((response) => {
            cy.task('calculateHash', response.body).then((hash) => {
              cy.writeFile('cypress/debug_logo.png', response.body, 'base64')
              expect(hash).to.equal(data.alternateLogoResizedHash)
            })
          })
        })
    })
  })

  it('Invalid logo fails to update', () => {
    cy.login(UserType.ADMIN)
    cy.visit('/settings')
    cy.get('[data-cy="logo-upload"]').attachFile('invalid_logo.png')
    cy.contains('Failed').should('exist')
    cy.get('[data-cy="logo-preview"]').should('not.exist')
  })

  it('Can delete an org Logo', () => {
    cy.login(UserType.ADMIN)
    cy.visit('/settings')
    // Upload a logo to delete
    cy.get('[data-cy="logo-upload"]').attachFile('valid_logo.png')
    cy.contains('Updated logo').should('exist')
    cy.readFile('../common/testing/fixtures/logo_hashes.json').then((data) => {
      cy.get('[data-cy="logo-preview"]')
        .should('be.visible')
        .and('have.attr', 'src')
        .then((src) => {
          cy.request({ url: src, encoding: 'base64' }).then((response) => {
            cy.task('calculateHash', response.body).then((hash) => {
              expect(hash).to.equal(data.validLogoResizedHash)
            })
          })
        })
    })

    // test logo delete
    cy.get('[data-cy="logo-delete"]').click()
    cy.contains('Deleted logo').should('exist')
    cy.get('[data-cy="logo-preview"]').should('not.exist')
  })
})
