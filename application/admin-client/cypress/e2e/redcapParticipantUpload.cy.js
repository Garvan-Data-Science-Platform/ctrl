/// <reference types="cypress" />

const { UserType } = require('../support/commands')

beforeEach(() => {
  cy.task('reset')
  cy.login(UserType.ADMIN)
  cy.visit('/integrations')
  cy.contains('Import Participants').should('exist').click()
})

describe('REDCap Participant Upload', () => {
  describe('Participant Import Page', () => {
    it('should display REDCap logo', () => {
      cy.get('img[alt="REDCap Logo"]')
        .should('be.visible')
        .should('have.attr', 'src', '/redcap.png')
    })

    it('should display both import sections', () => {
      cy.contains('Upload participant File').should('exist')
      cy.contains('Import from REDCap API').should('exist')
    })

    it('should have upload button and API form', () => {
      cy.contains('UPLOAD FILE').should('be.visible')
      cy.contains('button', 'Import from API').should('be.visible')
    })

    it('should handle file upload', () => {
      const fileName0 = 'test_participant0.csv'
      cy.get('Confirm').should('not.exist')
      cy.get('[data-cy="participantAttach"]').attachFile(fileName0)
      cy.get('Confirm').should('not.exist')
      cy.contains(fileName0).should('be.visible')

      //
      const fileName1 = 'test_instrument1.csv'
      cy.get('[data-cy="participantAttach"]').attachFile(fileName1)
      cy.get('Confirm').should('not.exist')
      cy.contains(fileName1).should('be.visible')
    })

    it('should handle successful file upload submission', () => {
      // Check current draft metadata
      let initialInvites
      let updatedInvites
      cy.request({
        method: 'GET',
        url: 'http://localhost:5001/studies/1/invites',
        headers: {
          Authorization: `Bearer ${window.localStorage.getItem('refine-auth')}`,
        },
      }).then((response) => {
        expect(response.status).to.eq(200)
        initialInvites = response.body.data
        cy.wrap(initialInvites).as('initialInvites')
      })

      const fileName = 'test_participant0.csv'
      cy.get('[data-cy="participantAttach"]').attachFile(fileName)

      // Click the initial confirm button
      cy.contains('button', 'Confirm').click()

      cy.url({ timeout: 10000 }).should('include', '/participants/')

      // Check that the invite modal is opened and it has the correct emails
      cy.get('[data-cy="invite-modal"]').should('be.visible')

      const expectedEmailsInModal = [
        'peter@louka.com',
        'a@example.com',
        'b@example.com',
        'c@example.com',
        'd@example.com',
        'e@example.com',
        'example@example.com',
        'example2@example.com',
      ]
      cy.get('[data-cy="recipients-list"]').within(() => {
        expectedEmailsInModal.forEach((email) => {
          cy.contains(email).should('exist')
        })
        // Verify total number of emails matches expected
        cy.get('[data-cy="remove-button"]').should('have.length', expectedEmailsInModal.length)
      })

      cy.get('[data-cy="send-button"]').should('be.visible').click()
      cy.wait(10000)

      // Check updated invites
      cy.request({
        method: 'GET',
        url: 'http://localhost:5001/studies/1/invites',
        headers: {
          Authorization: `Bearer ${window.localStorage.getItem('refine-auth')}`,
        },
      }).then((response) => {
        expect(response.status).to.eq(200)
        updatedInvites = response.body.data
        cy.wrap(updatedInvites).as('updatedInvites')
      })

      // Check that the participant has been updated
      cy.get('@initialInvites').then((initialInvites) => {
        cy.get('@updatedInvites').then((updatedInvites) => {
          console.log('initialInvites', initialInvites)
          console.log('updatedInvites', updatedInvites)
          const num_new_invites = updatedInvites.length - initialInvites.length
          expect(initialInvites.length).to.be.lessThan(updatedInvites.length)
          expect(num_new_invites).to.eq(8)
        })
      })
    })

    it('should handle successful API import', () => {
      // Check current draft metadata
      let initialInvites
      let updatedInvites
      cy.request({
        method: 'GET',
        url: 'http://localhost:5001/studies/1/invites',
        headers: {
          Authorization: `Bearer ${window.localStorage.getItem('refine-auth')}`,
        },
      }).then((response) => {
        expect(response.status).to.eq(200)
        initialInvites = response.body.data
        cy.wrap(initialInvites).as('initialInvites')
      })

      cy.get('[data-cy="apiSubmit"]').should('be.visible')

      cy.intercept('POST', '**/integrations/redcap/participant/upload/api', {
        statusCode: 200,
        body: {
          profilesCreatedCount: 3,
          profilesAlreadyExistedCount: 0,
          ids: [],
          newInvites: ['first@example.com', 'example@example.com', 'new@email.com'],
        },
      })

      cy.contains('button', 'Import from API').click()

      cy.url().should('include', '/participants/')

      // Check that the invite modal is opened and it has the correct emails
      cy.get('[data-cy="invite-modal"]').should('be.visible')

      const expectedEmailsInModal = ['first@example.com', 'example@example.com', 'new@email.com']
      cy.get('[data-cy="recipients-list"]').within(() => {
        expectedEmailsInModal.forEach((email) => {
          cy.contains(email).should('exist')
        })
        // Verify total number of emails matches expected
        cy.get('[data-cy="remove-button"]').should('have.length', expectedEmailsInModal.length)
      })

      cy.get('[data-cy="send-button"]').should('be.visible').click()

      // Check updated updated list of invites
      cy.request({
        method: 'GET',
        url: 'http://localhost:5001/studies/1/invites',
        headers: {
          Authorization: `Bearer ${window.localStorage.getItem('refine-auth')}`,
        },
      }).then((response) => {
        expect(response.status).to.eq(200)
        updatedInvites = response.body.data
        cy.wrap(updatedInvites).as('updatedInvites')
      })
    })

    it('should open and close help modal', () => {
      cy.contains('How to export participants from REDCap').click()
      cy.get('[data-cy="helpPage"]').should('be.visible')
      cy.get('[data-cy="closeHelpPage"]').click()
      cy.get('[data-cy="helpPage"]').should('not.exist')
    })
  })
})
