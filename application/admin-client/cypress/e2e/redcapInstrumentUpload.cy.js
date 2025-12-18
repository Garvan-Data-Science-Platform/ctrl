/// <reference types="cypress" />

const { UserType } = require('../../../common/cypress/support/commands')

beforeEach(() => {
  cy.task('reset')
  cy.login(UserType.ADMIN)
  cy.visit('/integrations')
  cy.contains('Import Survey').should('exist').click()
})

describe('REDCap Survey Upload', () => {
  describe('Survey Import Page', () => {
    it('should display REDCap logo', () => {
      cy.get('img[alt="REDCap Logo"]')
        .should('be.visible')
        .should('have.attr', 'src', '/redcap.png')
    })

    it('should display both import sections', () => {
      cy.contains('Upload survey File').should('exist')
      cy.contains('Import from REDCap API').should('exist')
    })

    it('should have upload button and API form', () => {
      cy.contains('UPLOAD FILE').should('be.visible')
      cy.get('[data-cy="formName"]').should('be.visible')
      cy.contains('button', 'Import from API').should('be.visible')
    })

    it('should handle file upload', () => {
      const fileName0 = 'test_instrument0.csv'
      cy.get('Confirm').should('not.exist')
      cy.get('[data-cy="surveyAttach"]').attachFile(fileName0)
      cy.get('Confirm').should('not.exist')
      cy.contains(fileName0).should('be.visible')

      //
      const fileName1 = 'test_instrument1.csv'
      cy.get('[data-cy="surveyAttach"]').attachFile(fileName1)
      cy.get('Confirm').should('not.exist')
      cy.contains(fileName1).should('be.visible')
    })

    it('should handle successful file upload submission', () => {
      // Check current draft metadata
      let initialDraft
      let updatedDraft
      cy.request({
        method: 'GET',
        url: 'http://localhost:5001/studies/1/surveys',
        headers: {
          Authorization: `Bearer ${window.localStorage.getItem('refine-auth')}`,
        },
      }).then((response) => {
        expect(response.status).to.eq(200)
        initialDraft = response.body.data[0]
        cy.wrap(initialDraft).as('initialDraft')
      })

      const fileName = 'test_instrument0.csv'
      cy.get('[data-cy="surveyAttach"]').attachFile(fileName)

      // Click the initial confirm button
      cy.contains('button', 'Confirm').click()

      // Verify dialog content
      cy.get('[data-cy="confirmDialog"]').should('be.visible')
      cy.contains('Warning: This action will overwrite the current draft survey').should(
        'be.visible',
      )
      cy.contains(`The imported data from "${fileName}" will replace any existing content`).should(
        'be.visible',
      )

      // Click the confirmation button in dialog
      cy.contains('button', 'Yes, Overwrite').click()

      // Intercept the upload request
      cy.intercept('POST', '**/integrations/redcap/instrument/upload/csv', {
        statusCode: 200,
      }).as('uploadFile')

      cy.url().should('include', '/surveys/edit/')
      cy.url().should('not.include', ':versionNumber')

      // Check updated draft metadata
      cy.request({
        method: 'GET',
        url: 'http://localhost:5001/studies/1/surveys',
        headers: {
          Authorization: `Bearer ${window.localStorage.getItem('refine-auth')}`,
        },
      }).then((response) => {
        expect(response.status).to.eq(200)
        updatedDraft = response.body.data[0]
        cy.wrap(updatedDraft).as('updatedDraft')
      })

      // Check that the survey has been updated
      cy.get('@initialDraft').then((initialDraft) => {
        cy.get('@updatedDraft').then((updatedDraft) => {
          expect(initialDraft.id).to.eq(updatedDraft.id)
          expect(new Date(initialDraft.updatedAt)).to.be.lessThan(new Date(updatedDraft.updatedAt))
        })
      })
    })

    it('should handle successful API import', () => {
      // Check current draft metadata
      let initialDraft
      let updatedDraft
      cy.request({
        method: 'GET',
        url: 'http://localhost:5001/studies/1/surveys',
        headers: {
          Authorization: `Bearer ${window.localStorage.getItem('refine-auth')}`,
        },
      }).then((response) => {
        expect(response.status).to.eq(200)
        initialDraft = response.body.data[0]
        cy.wrap(initialDraft).as('initialDraft')
      })

      const formName = 'test_form'
      cy.get('[data-cy="apiSubmit"]').should('be.visible').should('be.disabled')
      cy.get('[data-cy="formName"]').should('be.visible').type(formName)
      cy.get('[data-cy="apiSubmit"]').should('be.visible').should('be.enabled')

      cy.contains('button', 'Import from API').click()

      // Verify dialog content
      cy.get('[data-cy="confirmDialog"]').should('be.visible')
      cy.contains('Warning: This action will overwrite the current draft survey').should(
        'be.visible',
      )
      cy.contains(`The imported data from "${formName}" will replace any existing content`).should(
        'be.visible',
      )

      cy.intercept('POST', '**/integrations/redcap/instrument/upload/api', {
        statusCode: 200,
      })

      // Click the confirmation button in dialog
      cy.contains('button', 'Yes, Overwrite').click()

      cy.url().should('include', '/surveys/edit/')
      cy.url().should('not.include', ':versionNumber')

      // Check updated draft metadata
      cy.request({
        method: 'GET',
        url: 'http://localhost:5001/studies/1/surveys',
        headers: {
          Authorization: `Bearer ${window.localStorage.getItem('refine-auth')}`,
        },
      }).then((response) => {
        expect(response.status).to.eq(200)
        updatedDraft = response.body.data[0]
        cy.wrap(updatedDraft).as('updatedDraft')
      })

      // Check that the survey has been updated
      cy.get('@initialDraft').then((initialDraft) => {
        cy.get('@updatedDraft').then((updatedDraft) => {
          expect(initialDraft.id).to.eq(updatedDraft.id)
        })
      })
    })

    it('should open and close help modal', () => {
      cy.contains('How to export surveys from REDCap').click()
      cy.get('[data-cy="helpPage"]').should('be.visible')
      cy.get('[data-cy="closeHelpPage"]').click()
      cy.get('[data-cy="helpPage"]').should('not.exist')
    })
  })
})
