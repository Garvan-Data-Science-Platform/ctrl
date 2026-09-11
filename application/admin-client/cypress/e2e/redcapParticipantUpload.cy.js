/// <reference types="cypress" />

const { TestUsers } = require('../../../common/testing/constants')
const { VALIDATION_MESSAGES } = require('../../../common/src/validation')

beforeEach(() => {
  cy.task('reset')
  cy.login(TestUsers.ORG_ADMIN.email)
  cy.visit('/integrations')
  cy.contains('Import Participants').should('exist').click()
})

describe('REDCap Participant Upload', () => {
  describe('Participant Import Page', () => {
    it('should display REDCap logo', () => {
      cy.get('img[alt="REDCap Logo"]')
        .should('be.visible')
        .should('have.attr', 'src')
        .and('match', /redcap-logo-(light|dark)\.png/)
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

      const fileName0 = 'test_participant0.csv'
      cy.get('Confirm').should('not.exist')
      cy.get('[data-cy="upload-button"]').click()
      cy.get('input[type="file"]').attachFile(fileName0)
      cy.contains('Select header row').should('exist')
      cy.contains('Next').click()
      cy.contains('Next').click()
      cy.contains('Confirm').click()
      cy.contains('Errors detected').should('be.visible')
      cy.contains('Cancel').click()
      cy.contains('Cancel').should('not.exist')
      cy.get('input[type="checkbox"]').eq(7).check({ force: true })
      cy.get('input[type="checkbox"]').eq(8).check({ force: true })
      cy.contains('Discard').click()
      cy.contains('Confirm').click()

      cy.url().should('include', 'participants')
      cy.get('[data-cy="prefill-details"]').first().trigger('mouseover')
      cy.contains('2001-01-01').should('be.visible')

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
      cy.contains('Invites sent').should('exist')

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
      const redcapInterceptBody = {
        newParticipants: [
          {
            email: 'first@example.com',
            prefill: {
              profile: {
                firstName: 'Peter',
                lastName: 'Louka',
                mobile: '0426397897',
                preferredContact: 'EMAIL',
                addressLine: 'test address',
                suburb: 'suburb',
                postcode: '2088',
                state: 'NSW',
                dob: '07/13/2000',
                participantType: 'STANDARD',
                nextOfKin: {
                  firstName: 'fake',
                  lastName: 'fakerson',
                  email: 'example2@example.com',
                  mobile: '0448434946',
                },
              },
              studyParticipant: { externalId: '1' },
            },
          },
          {
            email: 'example@example.com',
            prefill: {
              profile: {
                firstName: 'John',
                lastName: 'Smith',
                mobile: '0448434946',
                preferredContact: 'EMAIL',
                addressLine: '2 fake st',
                suburb: 'fakie',
                postcode: '2010',
                state: 'ACT',
                dob: '01/10/1984',
                participantType: 'STANDARD',
                nextOfKin: {
                  firstName: 'fake',
                  lastName: 'fakerson',
                  email: 'example2@example.com',
                  mobile: '0448434946',
                },
              },
              studyParticipant: { externalId: '4' },
            },
          },
          {
            email: 'new@email.com',
            prefill: {},
          },
        ],
        existingUsers: [],
      }

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
        body: redcapInterceptBody,
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

    it('should validate user input', () => {
      const fileNameXss = 'test_participantXss.csv'
      cy.get('[data-cy="upload-button"]').click()
      cy.get('input[type="file"]').attachFile(fileNameXss)
      cy.contains('Select header row').should('exist')
      cy.contains('Next').click()
      cy.contains('Next').click()
      // email
      cy.contains('xss-email').should('be.visible').realHover({ scrollBehavior: 'center' })
      cy.contains(VALIDATION_MESSAGES.EMAIL_INVALID).should('be.visible')
      // id
      cy.contains('xss-id').should('be.visible').realHover({ scrollBehavior: 'center' })
      cy.contains(VALIDATION_MESSAGES.EXTERNALID_INVALID).should('be.visible')
      // first name
      cy.contains('xss-first-name').should('be.visible').realHover({ scrollBehavior: 'center' })
      cy.contains(VALIDATION_MESSAGES.NAME_INVALID).should('be.visible')
      // last name
      cy.contains('xss-last-name').should('be.visible').realHover({ scrollBehavior: 'center' })
      cy.contains(VALIDATION_MESSAGES.NAME_INVALID).should('be.visible')
      // date of birth
      cy.contains('xss-dob').should('be.visible').realHover({ scrollBehavior: 'center' })
      cy.contains(VALIDATION_MESSAGES.DOB_INVALID).should('be.visible')
      // mobile (need to scroll to the right first)
      cy.contains('xss-mobile')
        .scrollIntoView({ block: 'center', inline: 'center' })
        .should('be.visible')
        .realHover({ scrollBehavior: 'center' })
      cy.contains(VALIDATION_MESSAGES.MOBILE_INVALID).should('be.visible')
      // address
      cy.contains('xss-address').should('be.visible').realHover()
      cy.contains(VALIDATION_MESSAGES.ADDRESS_INVALID).should('be.visible')
      // suburb
      cy.contains('xss-suburb').should('be.visible').realHover({ scrollBehavior: 'center' })
      cy.contains(VALIDATION_MESSAGES.ADDRESS_INVALID).should('be.visible')
      // postcode
      cy.contains('xss-postcode').should('be.visible').realHover({ scrollBehavior: 'center' })
      cy.contains(VALIDATION_MESSAGES.POSTCODE_INVALID).should('be.visible')
      // next of kin (nok) first name (need to scroll to the right again)
      cy.contains('xss-nok-first-name')
        .scrollIntoView({ block: 'center', inline: 'center' })
        .should('be.visible')
        .realHover({ scrollBehavior: 'center' })
      cy.contains(VALIDATION_MESSAGES.NAME_INVALID).should('be.visible')
      // nok last name
      cy.contains('xss-nok-last-name').should('be.visible').realHover({ scrollBehavior: 'center' })
      cy.contains(VALIDATION_MESSAGES.NAME_INVALID).should('be.visible')
      // nok email
      cy.contains('xss-nok-email').should('be.visible').realHover({ scrollBehavior: 'center' })
      cy.contains(VALIDATION_MESSAGES.EMAIL_INVALID).should('be.visible')

      // NOTE: state is a different case with drop down matching
      // cy.contains('xss-state').should('be.visible').realHover()
      // cy.contains(VALIDATION_MESSAGES.STATE_INVALID).should('be.visible') // TODO Need state invalid
    })
  })
})
