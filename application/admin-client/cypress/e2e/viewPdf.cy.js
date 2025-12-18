/// <reference types="cypress" />

beforeEach(() => {
  cy.task('reset')
})

const { UserType } = require('../../../common/cypress/support/commands')
const downloadsPath = 'cypress/downloads/'

describe('viewPdf', () => {
  it('Show correct information in PDF', () => {
    cy.login(UserType.ADMIN)
    cy.visit('/surveys')
    cy.intercept('GET', '/studies/1/surveys/2').as('requestPdf')
    cy.get('[data-cy="pdf-button"]').first().click()
    cy.wait('@requestPdf')
    cy.wait(500)
    cy.task('readDir', 'cypress/downloads')
      .then((files) => {
        const regex = /^CTRL-consent-form.*_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}\.pdf$/
        const pdfFiles = files.filter((file) => regex.test(file))

        return cy.task('getLatestFile', pdfFiles)
      })
      .then((latestFile) => {
        cy.wrap(`cypress/downloads/${latestFile}`).as('pdfFile')
      })

    cy.get('@pdfFile').then((pdfFile) => {
      cy.readFile(pdfFile).should('exist')
      cy.task('readPdf', pdfFile).then((pdfText) => {
        const cleanedText = pdfText.replace(/\n/g, ' ')
        cy.wrap(cleanedText)
          .should('contain', 'V2')
          .should('contain', 'Test Study')
          .should('contain', 'Yes / No')
          .should('contain', 'Choice 1 / Choice 2')
          .should('contain', 'SUBHEADING text')
          .should('contain', 'Question 1')
          .should('contain', 'Tooltip: Example tooltip')
      })

      cy.task('deleteFile', pdfFile)
    })
  })
})
