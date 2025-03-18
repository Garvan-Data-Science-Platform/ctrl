/// <reference types="cypress" />

beforeEach(() => {
  cy.task('reset')
})

const { UserType } = require('../support/commands')
const downloadsPath = 'cypress/downloads/'

// email: 'test2@example.com',
// firstName: 'Test',
// lastName: 'User',
// login as person who has answered some things
// view pdf
// see name, profile info
// see answers
// login as person who has answered some things in the past
// update a response
// see response has changed
// hard to test date :(
// pdf error page?

describe('viewPdf', () => {
  it('If unanswered, PDF shows "not answered"', () => {
    cy.login(UserType.PARTICIPANT_UNANSWERED)
    cy.visit('/')
    cy.contains('Intro').should('exist')
    cy.get('[data-cy="step-card-0"]').contains('Requires Review').should('exist')
    cy.intercept('GET', '/surveys/responses/current').as('requestPdf')
    cy.get('[data-cy="view-pdf"]').click()
    cy.wait('@requestPdf')
    cy.task('readDir', 'cypress/downloads')
      .then((files) => {
        const regex = /^CTRL-responses-Test_User_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}\.pdf$/
        const pdfFiles = files.filter((file) => regex.test(file))

        return cy.task('getLatestFile', pdfFiles)
      })
      .then((latestFile) => {
        cy.wrap(`cypress/downloads/${latestFile}`).as('pdfFile')
      })

    cy.get('@pdfFile').then((pdfFile) => {
      cy.readFile(pdfFile).should('exist')
      // Add further processing like parsing the file here
    })
  })
})
