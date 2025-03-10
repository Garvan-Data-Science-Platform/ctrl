/// <reference types="cypress" />

const { UserType } = require('../support/commands')

beforeEach(() => {
  cy.task('reset')
  cy.login(UserType.ADMIN)
  cy.visit('/surveys/edit/2')
  cy.contains('Import REDCap Instrument').should('exist').click()
})

describe('REDCap Instrument Upload', () => {
  describe('Survey Import Page', () => {
    it('should display REDCap logo', () => {
      cy.get('img[alt="REDCap Logo"]')
        .should('be.visible')
        .should('have.attr', 'src', '/redcap.png')
    })

    it('should display both import sections', () => {
      cy.contains('Upload Instrument File').should('exist')
      cy.contains('Import from REDCap API').should('exist')
    })

    it('should have upload button and API form', () => {
      cy.contains('UPLOAD FILE').should('be.visible')
      cy.get('input[type="text"]').should('be.visible')
      cy.contains('button', 'Import from API').should('be.visible')
    })

    it('should handle file upload', () => {
      const fileName = 'test_instrument.csv'
      cy.contains('Download').should('not.exist')
      cy.contains('Remove').should('not.exist')
      cy.get('input[type="file"]').attachFile(fileName)
      cy.contains(fileName).should('be.visible')
      cy.contains('Remove').should('be.visible')
      cy.contains('Download').should('be.visible')
    })

    it('should remove uploaded file', () => {
      const fileName = 'test_instrument.csv'
      cy.get('input[type="file"]').attachFile(fileName)
      cy.contains('Remove').click()
      cy.contains(fileName).should('not.exist')
    })

    it('should show error when submitting without file', () => {
      cy.contains('button', 'Save as Draft').click()
      cy.on('window:alert', (text) => {
        expect(text).to.equal('Please upload a file before submitting.')
      })
    })

    it('should handle successful file upload submission', () => {
      const fileName = 'test_instrument.csv'
      cy.get('input[type="file"]').attachFile(fileName)

      cy.intercept('POST', '**/integrations/redcap/instrument/upload/csv', {
        statusCode: 200,
        body: { id: '123' },
      }).as('uploadFile')

      cy.contains('button', 'Save as Draft').click()
      cy.wait('@uploadFile')
      cy.url().should('include', '/surveys/edit/123')
    })

    it('should handle empty form submission', () => {
      cy.contains('button', 'Import from API').click()
      cy.on('window:alert', (text) => {
        expect(text).to.equal('Please enter a form to pull from REDCap')
      })
    })

    it('should handle successful API import', () => {
      cy.get('input[type="text"]').type('test_form')

      cy.intercept('POST', '**/integrations/redcap/instrument/upload/api', {
        statusCode: 200,
        body: { id: '456' },
      }).as('apiImport')

      cy.contains('button', 'Import from API').click()
      cy.wait('@apiImport')
      cy.url().should('include', '/surveys/edit/456')
    })

    it('should open and close help modal', () => {
      cy.contains('How to export instruments from REDCap').click()
      cy.get('[aria-labelledby="modal-title"]').should('be.visible')
      cy.get('[data-testid="CloseIcon"]').click()
      cy.get('[aria-labelledby="modal-title"]').should('not.exist')
    })
  })
})
