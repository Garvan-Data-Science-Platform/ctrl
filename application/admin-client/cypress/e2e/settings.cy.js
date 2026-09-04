/// <reference types="cypress" />

const { TestUsers } = require('../../../common/testing/constants')
const { VALIDATION_MESSAGES } = require('../../../common/src/validation')

beforeEach(() => {
  cy.task('reset')
  cy.login(TestUsers.ORG_ADMIN.email)
})

describe('Settings page', () => {
  const fieldMap = {
    primaryColour: 'red',
    secondaryColour: 'blue',
  }

  it('Can edit settings and save them', () => {
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

  it('Can upload a logo', () => {
    cy.visit('/settings')
    cy.uploadCommonFile('[data-cy="logo-upload"]', 'valid_logo.png')
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
    cy.visit('/settings')
    // Upload original logo
    cy.uploadCommonFile('[data-cy="logo-upload"]', 'valid_logo.png')
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
    cy.uploadCommonFile('[data-cy="logo-upload"]', 'alternate_logo.png')
    cy.contains('Updated logo').should('exist')
    cy.readFile('../common/testing/fixtures/logo_hashes.json').then((data) => {
      cy.get('[data-cy="logo-preview"]')
        .should('be.visible')
        .and('have.attr', 'src')
        .then((src) => {
          cy.request({ url: src, encoding: 'base64' }).then((response) => {
            cy.task('calculateHash', response.body).then((hash) => {
              expect(hash).to.equal(data.alternateLogoResizedHash)
            })
          })
        })
    })
  })

  it('Invalid logo fails to update', () => {
    cy.visit('/settings')
    cy.uploadCommonFile('[data-cy="logo-upload"]', 'invalid_logo.png')
    cy.contains('Failed').should('exist')
    cy.get('[data-cy="logo-preview"]').should('not.exist')
  })

  it('Can delete an org Logo', () => {
    cy.visit('/settings')
    // Upload a logo to delete
    cy.uploadCommonFile('[data-cy="logo-upload"]', 'valid_logo.png')
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

  it('Invalid tcLink url prevent saving and show appropriate error messages', () => {
    cy.visit('/settings')

    cy.get('[data-cy="tcLink"] input').clear().type("{{7*7}}<script>alert('xss-tcLink')</script>", {
      parseSpecialCharSequences: false,
    })

    cy.get('[data-cy="save-button"]').click()

    cy.contains(VALIDATION_MESSAGES.URL_INVALID).should('exist')
  })

  it('Invalid newsLink url prevent saving and show appropriate error messages', () => {
    cy.visit('/settings')

    cy.get('[data-cy="newsLink"] input')
      .clear()
      .type("{{7*7}}<script>alert('xss-newsLink')</script>", {
        parseSpecialCharSequences: false,
      })

    cy.get('[data-cy="save-button"]').click()

    cy.contains(VALIDATION_MESSAGES.URL_INVALID).should('exist')
  })

  it('Invalid primary colour prevent saving and show appropriate error messages', () => {
    const values = { ...fieldMap, primaryColour: 'abc' }

    cy.visit('/settings')

    for (const [key, value] of Object.entries(values)) {
      cy.get(`[data-cy="${key}"] input`).clear().type(value)
    }
    cy.get('[data-cy="save-button"]').click()

    cy.contains('Not a recognised CSS colour').should('exist')

    for (const [key, value] of Object.entries(fieldMap)) {
      cy.get(`[data-cy="${key}"] input`).clear().type(value)
    }

    cy.contains('Not a recognised CSS colour').should('not.exist')
  })

  it('Invalid xss primary colour prevent saving and show appropriate error messages', () => {
    const values = {
      ...fieldMap,
      primaryColour: "{{7*7}}<script>alert('xss-primary-colour')</script>",
    }

    cy.visit('/settings')

    for (const [key, value] of Object.entries(values)) {
      cy.get(`[data-cy="${key}"] input`).clear().type(value, {
        parseSpecialCharSequences: false,
      })
    }
    cy.get('[data-cy="save-button"]').click()

    cy.contains(VALIDATION_MESSAGES.CSS_COLOUR_INVALID).should('exist')
  })

  it('Invalid xss secondary colour prevent saving and show appropriate error messages', () => {
    const values = {
      ...fieldMap,
      secondaryColour: "{{7*7}}<script>alert('xss-secondary-colour')</script>",
    }

    cy.visit('/settings')

    for (const [key, value] of Object.entries(values)) {
      cy.get(`[data-cy="${key}"] input`).clear().type(value, {
        parseSpecialCharSequences: false,
      })
    }
    cy.get('[data-cy="save-button"]').click()

    cy.contains(VALIDATION_MESSAGES.CSS_COLOUR_INVALID).should('exist')
  })
})
