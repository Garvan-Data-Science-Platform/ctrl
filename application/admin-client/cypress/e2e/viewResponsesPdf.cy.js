/// <reference types="cypress" />

beforeEach(() => {
  cy.task('reset')
})

const { UserType } = require('../../../common/cypress/support/commands')
const downloadsPath = 'cypress/downloads/'

const testCases = [
  {
    description: 'unanswered participant',
    selectorIndex: 0,
    expectedText: 'Unanswered User',
  },
  {
    description: 'completed participant',
    selectorIndex: 1,
    expectedText: 'Completed User',
  },
]

describe('Admin PDF Export', () => {
  testCases.forEach(({ description, selectorIndex, expectedText }) => {
    it(`Show correct information in PDF for ${description}`, () => {
      cy.login(UserType.ADMIN)
      cy.visit('/participants')

      cy.intercept('GET', '/studies/1/participants/*/').as('requestPdf')
      cy.get('[data-cy="pdf-button"]').eq(selectorIndex).click()

      cy.wait('@requestPdf')
      cy.wait(500)
      cy.task('readDir', 'cypress/downloads')
        .then((files) => {
          const regex = /^CTRL-response.*_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}\.pdf$/
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
          cy.wrap(cleanedText).should('contain', expectedText)
        })

        cy.task('deleteFile', pdfFile)
      })
    })
  })
})
