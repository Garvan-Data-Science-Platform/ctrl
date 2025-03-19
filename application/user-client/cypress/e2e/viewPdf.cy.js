/// <reference types="cypress" />

beforeEach(() => {
  cy.task('reset')
})

const { UserType } = require('../support/commands')
const downloadsPath = 'cypress/downloads/'

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
    // Check UI to ensure matches expectations
    cy.get('[data-cy="step-card-0"]').contains('Requires Review').should('exist')
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
      // Check PDF
      cy.task('readPdf', pdfFile).should('contain', 'Question 1 Not answered')
      cy.task('deleteFile', pdfFile)
    })
  })

  it('If answered, PDF shows correct answer', () => {
    cy.login(UserType.PARTICIPANT_COMPLETED)
    cy.visit('/')
    cy.contains('Intro').should('exist')
    // Check UI to ensure matches expectations
    cy.get('[data-cy="step-card-0"]').contains('Reviewed').should('exist')
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
      // Check PDF
      cy.task('readPdf', pdfFile).should('contain', 'Question 1 No')
      cy.task('deleteFile', pdfFile)
    })
  })

  it('checks answers, changes them and checks updated answers are updated in PDF', () => {
    cy.login(UserType.PARTICIPANT_COMPLETED)
    cy.visit('/')
    cy.contains('Intro').should('exist')
    // Check UI to ensure matches expectations
    cy.get('[data-cy="step-card-0"]').contains('Reviewed').should('exist')

    // Check pdf answer
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
      // Check PDF
      cy.task('readPdf', pdfFile).should('contain', 'Question 2 Choice 2')
      cy.task('deleteFile', pdfFile)
    })

    // Change response from above test
    cy.get('[data-cy="step-button-1"]').click()
    cy.get('input[type="radio"]').eq(0).should('not.be.checked')
    cy.get('input[type="radio"]').eq(0).click()
    cy.get('input[type="radio"]').eq(0).should('be.checked')
    cy.contains('Save').click()
    cy.get('[data-cy="proceed-button"]').click()

    // Check response in PDF
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
      // Check PDF
      cy.task('readPdf', pdfFile).should('contain', 'Question 2 Choice 1')
      cy.task('deleteFile', pdfFile)
    })

    // Change response back to original
    // This updates the reviewed date from that in seed data
    // Hopefullly this isn't a problem for other tests
    cy.get('[data-cy="step-button-1"]').click()
    cy.get('input[type="radio"]').eq(0).should('be.checked')
    cy.get('input[type="radio"]').eq(1).click()
    cy.get('input[type="radio"]').eq(0).should('not.be.checked')
    cy.contains('Save').click()
    cy.get('[data-cy="proceed-button"]').click()
  })
})
