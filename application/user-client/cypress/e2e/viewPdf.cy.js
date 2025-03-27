/// <reference types="cypress" />

beforeEach(() => {
  cy.task('reset')
})

const { UserType } = require('../support/commands')
const downloadsPath = 'cypress/downloads/'

describe('viewPdf', () => {
  // Function to:
  //  - click 'View responses' button,
  //  - access latest downloaded PDF that matches specific Regex
  //    - (note 'Test User' and date format assumptions)
  //  - parse PDF
  //  - check contents include specific text_string parameter.
  function assertPdfContains(text_string) {
    cy.intercept('GET', '/surveys/responses/current').as('requestPdf')
    cy.get('[data-cy="view-pdf"]').click()
    cy.wait('@requestPdf')
    cy.wait(500)
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
      // Parse PDF and check contents
      cy.task('readPdf', pdfFile).should('contain', text_string)
      // Delete PDF
      cy.task('deleteFile', pdfFile)
    })
  }

  it('If unanswered, PDF shows "not answered"', () => {
    cy.login(UserType.PARTICIPANT_UNANSWERED)
    cy.visit('/')
    cy.contains('Intro').should('exist')
    // Check UI to ensure it matches expectations
    cy.get('[data-cy="step-card-0"]').contains('Requires Review').should('exist')
    assertPdfContains('Question 1 Not answered')
  })

  it('If answered, PDF shows correct answer', () => {
    cy.login(UserType.PARTICIPANT_COMPLETED)
    cy.visit('/')
    cy.contains('Intro').should('exist')
    // Check UI to ensure it matches expectations
    cy.get('[data-cy="step-card-0"]').contains('Reviewed').should('exist')
    assertPdfContains('Question 1 No')
  })

  it('checks answers, changes them and checks updated answers are updated in PDF', () => {
    cy.login(UserType.PARTICIPANT_COMPLETED)
    cy.visit('/')
    cy.contains('Intro').should('exist')
    // Check UI to ensure it matches expectations
    cy.get('[data-cy="step-card-0"]').contains('Reviewed').should('exist')
    assertPdfContains('Question 2 Choice 2')

    // Change response from above test
    cy.get('[data-cy="step-button-1"]').click()
    cy.get('input[type="radio"]').eq(0).should('not.be.checked')
    cy.get('input[type="radio"]').eq(0).click()
    cy.get('input[type="radio"]').eq(0).should('be.checked')
    cy.contains('Save').click()
    cy.get('[data-cy="proceed-button"]').click()
    assertPdfContains('Question 2 Choice 1')

    // Change response back to original
    // This updates the reviewed date to be later that in the seed data
    // Hopefullly this isn't a problem for other tests
    cy.get('[data-cy="step-button-1"]').click()
    cy.get('input[type="radio"]').eq(0).should('be.checked')
    cy.get('input[type="radio"]').eq(1).click()
    cy.get('input[type="radio"]').eq(0).should('not.be.checked')
    cy.contains('Save').click()
    cy.get('[data-cy="proceed-button"]').click()
  })

  it('should display error when PDF generation fails', () => {
    cy.login(UserType.PARTICIPANT_UNANSWERED)
    cy.visit('/')

    // Mock the API response to return an error
    cy.intercept('GET', '/surveys/responses/current', {
      statusCode: 500,
      body: { error: 'Server error' },
    }).as('getResponses')
    cy.get('[data-cy="view-pdf"]').click()
    cy.wait('@getResponses')

    // Assert that the error message is displayed
    cy.contains('Error Creating PDF').should('be.visible')
  })
})
