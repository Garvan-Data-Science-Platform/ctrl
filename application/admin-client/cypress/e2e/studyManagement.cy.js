/// <reference types="cypress" />

const { UserType } = require('../../../common/cypress/support/commands')

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

  it('Can edit advanced settings', () => {
    cy.visit('/studies')
    cy.get('[data-cy="advanced-toggle"]').eq(1).click()
    cy.get('[data-cy="redcapURL"] input').eq(1).type('abc')
    cy.get('[data-cy="redcapToken"] input').eq(1).type('abc123')
    cy.get('[data-cy="settings-apply"]').eq(1).click()
    cy.contains('Invalid Redcap').should('exist')
    cy.get('[data-cy="redcapURL"] input').eq(1).clear().type('https://abc.com')
    cy.get('[data-cy="contactUsEmail"] input').eq(1).clear().type('a')
    cy.get('[data-cy="settings-apply"]').eq(1).click()
    cy.contains('Invalid Email').should('exist')
    cy.get('[data-cy="contactUsEmail"] input').eq(1).clear().type('a@b.com')
    cy.get('[data-cy="settings-apply"]').eq(1).click()
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
    cy.visit('/studies')
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

  it('Can update a study logo', () => {
    cy.visit('/studies')
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
    cy.visit('/studies')
    cy.uploadCommonFile('[data-cy="logo-upload"]', 'invalid_logo.png')
    cy.contains('Failed').should('exist')
    cy.get('[data-cy="logo-preview"]').should('not.exist')
  })

  it('Can delete a study logo', () => {
    cy.visit('/studies')
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

  it('Should not show token information', () => {
    cy.visit('/studies')
    cy.get('[data-cy="advanced-toggle"]').eq(1).click()
    cy.get('[data-cy="redcapToken"] input').eq(1).type('abc123')
    cy.contains('abc123').should('not.exist') // due to SensitiveTextField
    cy.get('[data-cy="settings-apply"]').eq(1).click()
    cy.contains('abc123').should('not.exist')
  })
})
