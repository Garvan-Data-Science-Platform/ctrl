/// <reference types="cypress" />

beforeEach(() => {
  cy.task('reset')
})

const { TestUsers, TestStudies } = require('../../../common/testing/constants.ts')
const downloadsPath = 'cypress/downloads/'

// Note: the tests below make heavy use of environment variables
//   These env vars pull in variables specified in the test seed data
//   (`application/common/testing/seed.ts`)
const studyName = TestStudies.TEST_STUDY.name
const studyId = TestStudies.TEST_STUDY.id
const feStudyName = TestStudies.FE_TEST_STUDY.name
const feStudyId = TestStudies.FE_TEST_STUDY.id

describe('viewPdf', () => {
  let hashes

  before(() => {
    cy.readFile('../common/testing/fixtures/logo_hashes.json').then(
      (hash_data) => (hashes = hash_data),
    )
  })

  function assertPdfContains(studyId, text_string) {
    // Function to:
    //  - click 'View responses' button,
    //  - access latest downloaded PDF that matches specific Regex
    //  - parse PDF
    //  - check contents include specific text_string parameter.
    //  - deletes downloaded file
    cy.intercept('GET', `/studies/${studyId}/survey-answers`).as('requestPdf')
    cy.get('[data-cy="view-pdf"]').click()
    cy.wait('@requestPdf')
    cy.wait(500)
    cy.task('readDir', 'cypress/downloads')
      .then((files) => {
        const regex = /^CTRL-responses-.*_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}\.pdf$/
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

  function assertPdfFilenameContains(studyId, filename_string) {
    // Function to:
    //  - click 'View responses' button,
    //  - access latest downloaded PDF that matches specific Regex
    //  - check filename includes specific filename_string parameter.
    //  - deletes downloaded file
    cy.intercept('GET', `/studies/${studyId}/survey-answers`).as('requestPdf')
    cy.get('[data-cy="view-pdf"]').click()
    cy.wait('@requestPdf')
    cy.wait(500)
    cy.task('readDir', 'cypress/downloads')
      .then((files) => {
        const regex = /^CTRL-responses-.*_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}\.pdf$/
        const pdfFiles = files.filter((file) => regex.test(file))

        return cy.task('getLatestFile', pdfFiles)
      })
      .then((latestFile) => {
        cy.wrap(`cypress/downloads/${latestFile}`).as('pdfFile')
      })
    cy.get('@pdfFile').then((pdfFile) => {
      expect(pdfFile).to.include(filename_string)
      // Delete PDF
      cy.task('deleteFile', pdfFile)
    })
  }

  it('If unanswered, PDF shows "not answered"', () => {
    cy.login(TestUsers.PARTICIPANT_UNANSWERED.email)
    cy.visit('/')
    cy.contains('Intro').should('exist')
    // Check UI to ensure it matches expectations
    cy.get('[data-cy="step-card-0"]').contains('Requires Review').should('exist')
    assertPdfContains(studyId, 'Question 1 Not answered')
  })

  it('If answered, PDF shows correct answer', () => {
    cy.login(TestUsers.PARTICIPANT_COMPLETED.email)
    cy.visit('/')
    cy.contains('Intro').should('exist')
    // Check UI to ensure it matches expectations
    cy.get('[data-cy="step-card-0"]').contains('Reviewed').should('exist')
    assertPdfContains(studyId, 'Question 1 No')
  })

  it('checks answers, changes them and checks updated answers are updated in PDF', () => {
    cy.login(TestUsers.PARTICIPANT_COMPLETED.email)
    cy.visit('/')
    cy.contains('Intro').should('exist')
    // Check UI to ensure it matches expectations
    cy.get('[data-cy="step-card-0"]').contains('Reviewed').should('exist')
    assertPdfContains(studyId, 'Question 2 Choice 2')

    // Change response from above test
    cy.get('[data-cy="step-button-1"]').click()
    cy.get('input[type="radio"]').eq(0).should('not.be.checked')
    cy.get('input[type="radio"]').eq(0).click()
    cy.get('input[type="radio"]').eq(0).should('be.checked')
    cy.contains('Save').click()
    cy.get('[data-cy="proceed-button"]').click()
    assertPdfContains(studyId, 'Question 2 Choice 1')

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
    cy.login(TestUsers.PARTICIPANT_UNANSWERED.email)
    cy.visit('/')

    // Mock the API response to return an error
    cy.intercept('GET', `/studies/${studyId}/survey-answers`, {
      statusCode: 500,
      body: { error: 'Server error' },
    }).as('getResponses')
    cy.get('[data-cy="view-pdf"]').click()
    cy.wait('@getResponses')

    // Assert that the error message is displayed
    cy.contains('Error Creating PDF').should('be.visible')
  })

  it('PDF text contains study name', () => {
    cy.login(TestUsers.PARTICIPANT_COMPLETED.email)
    cy.visit('/')
    cy.contains('Intro').should('exist')
    // Check UI to ensure it matches expectations
    cy.get('[data-cy="step-card-0"]').contains('Reviewed').should('exist')
    assertPdfContains(studyId, studyName)

    // changing study results in different study name
    cy.login(TestUsers.PARTICIPANT_UNANSWERED.email)
    cy.visit('/')
    cy.get('[data-cy="change-study"]').click()
    cy.contains('Study FE').click()
    cy.contains('Frontend study step').should('exist')
    assertPdfContains(feStudyId, feStudyName)
  })

  it('PDF file name contains study name', () => {
    cy.login(TestUsers.PARTICIPANT_COMPLETED.email)
    cy.visit('/')
    cy.contains('Intro').should('exist')
    // Check UI to ensure it matches expectations
    cy.get('[data-cy="step-card-0"]').contains('Reviewed').should('exist')
    cy.task('formatStudyName', studyName).then((formattedStudyName) => {
      assertPdfFilenameContains(studyId, formattedStudyName)
    })

    // changing study results in different study file name
    cy.login(TestUsers.PARTICIPANT_UNANSWERED.email)
    cy.visit('/')
    cy.get('[data-cy="change-study"]').click()
    cy.contains('Study FE').click()
    cy.contains('Frontend study step').should('exist')
    cy.task('formatStudyName', feStudyName).then((formattedStudyName) => {
      assertPdfFilenameContains(feStudyId, formattedStudyName)
    })
  })

  it('PDF fetches logos correctly', () => {
    const orgLogoEndpoint = '**/settings/logo?t=*'
    const studyLogoEndpoint = `**/studies/${studyId}/logo?t=*`
    cy.login(TestUsers.PARTICIPANT_UNANSWERED.email)
    cy.visit('/')

    // Intercept logo fetch
    cy.intercept('GET', orgLogoEndpoint).as('orgLogo404')
    cy.intercept('GET', studyLogoEndpoint).as('studyLogo404')

    // Trigger PDF generation
    cy.get('[data-cy="view-pdf"]').click()

    // Verify that both requests were attempted but returned 404
    cy.wait('@orgLogo404').its('response.statusCode').should('eq', 404)
    cy.wait('@studyLogo404').its('response.statusCode').should('eq', 404)

    // Set Org and study logos
    cy.task('updateLogo', {
      target: 'organisation',
      filePath: '../common/testing/fixtures/valid_logo.png',
    })
    cy.task('updateLogo', {
      target: 'study',
      id: studyId,
      filePath: '../common/testing/fixtures/alternate_logo.png',
    })

    cy.intercept('GET', orgLogoEndpoint, (req) => {
      req.continue((res) => {
        res.body = Buffer.from(res.body)
      })
    }).as('fetchOrgLogo')

    cy.intercept('GET', studyLogoEndpoint, (req) => {
      req.continue((res) => {
        res.body = Buffer.from(res.body)
      })
    }).as('fetchStudyLogo')

    // generate PDF
    cy.get('[data-cy="view-pdf"]').click()

    // run logo hash checks
    cy.wait('@fetchOrgLogo').then((req) => {
      expect(req.response.statusCode).to.equal(200)
      const base64Body = req.response.body.toString('base64')
      cy.task('calculateHash', base64Body).then((hash) => {
        expect(hash, 'Org Logo Hash').to.equal(hashes.validLogoResizedHash)
      })
    })

    cy.wait('@fetchStudyLogo').then((req) => {
      expect(req.response.statusCode).to.equal(200)
      const base64Body = req.response.body.toString('base64')
      cy.task('calculateHash', base64Body).then((hash) => {
        expect(hash, 'Study Logo Hash').to.equal(hashes.alternateLogoResizedHash)
      })
    })
  })
})
