/// <reference types="cypress" />

const { TestUsers } = require('../../../common/testing/constants')
const { VALIDATION_MESSAGES } = require('../../../common/src/validation')

beforeEach(() => {
  cy.task('reset')
})

describe('Participants', () => {
  it('List participants', () => {
    cy.login(TestUsers.ORG_ADMIN.email)
    cy.visit('/participants')
    cy.contains('Test').should('exist')
    cy.contains('Dependent').should('exist')
    cy.contains('V1').should('exist')
  })
  it('View participant details', () => {
    cy.login(TestUsers.ORG_ADMIN.email)
    cy.visit(`/participants/${TestUsers.PARTICIPANT_UNANSWERED.id}`)
    cy.contains('Unanswered User').should('exist')
    cy.contains('123 smith st').should('exist')
    cy.contains('V1').should('exist')
    cy.visit(`/participants/${TestUsers.PARTICIPANT_COMPLETED.id}`)
    cy.contains('Family').should('exist')
    cy.contains('Dependent').should('exist')
  })

  it('Edit participant details', () => {
    cy.login(TestUsers.ORG_ADMIN.email)
    cy.visit(`/participants/edit/${TestUsers.PARTICIPANT_UNANSWERED.id}`)
    cy.contains('Edit Participant').should('exist')
    cy.get('input[name="profile.addressLine"]').clear().type('1 Smith St')
    cy.get('input[name="profile.nextOfKin.firstName"]').clear().type('Betty')
    cy.get('input[name="profile.postcode"]').clear().type('222a')
    cy.get('input[name="externalId"]').clear().type('extID')
    cy.contains('Save').click()
    cy.contains(VALIDATION_MESSAGES.POSTCODE_INVALID).should('exist')
    cy.get('input[name="profile.postcode"]').clear().type('2222')
    cy.get('input[name="profile.nextOfKin.email"]').clear().type('invalid')
    cy.contains('Save').click()
    cy.contains(VALIDATION_MESSAGES.EMAIL_INVALID).should('exist')
    cy.get('input[name="profile.nextOfKin.email"]').clear().type('valid@email.com')
    cy.contains('Save').click()
    cy.url().should('contain', `participants/${TestUsers.PARTICIPANT_UNANSWERED.id}`)
    cy.contains('Betty').should('exist')
    cy.contains('extID').should('exist')
    cy.contains('1 Smith St').should('exist')
  })

  it('View answers', () => {
    cy.login(TestUsers.ORG_ADMIN.email)
    cy.visit('/participants')
    cy.get('[data-rowindex="0"]').contains('V1').trigger('mouseover', { force: true })
    cy.contains('Incomplete').should('be.visible')
    cy.get('[data-rowindex="1"]').contains('V1').trigger('mouseover', { force: true })
    cy.contains('Complete').should('be.visible')
    cy.get('[data-rowindex="1"]').contains('V1').click({ force: true })
    cy.contains('false').should('exist')
  })

  it('Shows completed and partially completed surveys', () => {
    cy.login(TestUsers.ORG_ADMIN.email)
    cy.visit('/participants')
    cy.get('[data-rowindex="0"]').contains('V1').trigger('mouseover', { force: true })
    cy.contains('Incomplete').should('be.visible')
    cy.task('partialComplete')
    cy.visit('/participants')
    cy.get('[data-rowindex="2"]').contains('V1').trigger('mouseover', { force: true })
    cy.contains('Incomplete').should('be.visible')
  })

  it('Edit participant, validate xss first name', () => {
    cy.login(TestUsers.ORG_ADMIN.email)
    cy.visit(`/participants/edit/${TestUsers.PARTICIPANT_UNANSWERED.id}`)
    cy.contains('Edit Participant').should('exist')
    cy.get('input[name="profile.firstName"]')
      .clear()
      .type("{{7*7}}<script>alert('xss-first-name')</script>", {
        parseSpecialCharSequences: false,
      })
    cy.contains('Save').click()
    cy.contains(VALIDATION_MESSAGES.NAME_INVALID).should('exist')
  })

  it('Edit participant, validate xss last name', () => {
    cy.login(TestUsers.ORG_ADMIN.email)
    cy.visit(`/participants/edit/${TestUsers.PARTICIPANT_UNANSWERED.id}`)
    cy.contains('Edit Participant').should('exist')
    cy.get('input[name="profile.lastName"]')
      .clear()
      .type("{{7*7}}<script>alert('xss-last-name')</script>", {
        parseSpecialCharSequences: false,
      })
    cy.contains('Save').click()
    cy.contains(VALIDATION_MESSAGES.NAME_INVALID).should('exist')
  })

  it('Edit participant, validate xss email', () => {
    cy.login(TestUsers.ORG_ADMIN.email)
    cy.visit(`/participants/edit/${TestUsers.PARTICIPANT_UNANSWERED.id}`)
    cy.contains('Edit Participant').should('exist')
    cy.get('input[name="profile.email"]')
      .clear()
      .type("{{7*7}}<script>alert('xss-email')</script>@gmail.com", {
        parseSpecialCharSequences: false,
      })
    cy.contains('Save').click()
    cy.contains(VALIDATION_MESSAGES.EMAIL_INVALID).should('exist')
  })

  it('Edit participant, validate xss externalId', () => {
    cy.login(TestUsers.ORG_ADMIN.email)
    cy.visit(`/participants/edit/${TestUsers.PARTICIPANT_UNANSWERED.id}`)
    cy.contains('Edit Participant').should('exist')
    cy.get('input[name="externalId"]')
      .clear()
      .type("{{7*7}}<script>alert('xss-externalId')</script>", {
        parseSpecialCharSequences: false,
      })
    cy.contains('Save').click()
    cy.contains(VALIDATION_MESSAGES.EXTERNALID_INVALID).should('exist')
  })

  it('Edit participant, validate xss address', () => {
    cy.login(TestUsers.ORG_ADMIN.email)
    cy.visit(`/participants/edit/${TestUsers.PARTICIPANT_UNANSWERED.id}`)
    cy.contains('Edit Participant').should('exist')
    cy.get('input[name="profile.addressLine"]')
      .clear()
      .type("{{7*7}}<script>alert('xss-address')</script>", {
        parseSpecialCharSequences: false,
      })
    cy.contains('Save').click()
    cy.contains(VALIDATION_MESSAGES.ADDRESS_INVALID).should('exist')
  })

  it('Edit participant, validate xss suburb', () => {
    cy.login(TestUsers.ORG_ADMIN.email)
    cy.visit(`/participants/edit/${TestUsers.PARTICIPANT_UNANSWERED.id}`)
    cy.contains('Edit Participant').should('exist')
    cy.get('input[name="profile.suburb"]')
      .clear()
      .type("{{7*7}}<script>alert('xss-suburb')</script>", {
        parseSpecialCharSequences: false,
      })
    cy.contains('Save').click()
    cy.contains(VALIDATION_MESSAGES.ADDRESS_INVALID).should('exist')
  })

  it('Edit participant, validate xss postcode', () => {
    cy.login(TestUsers.ORG_ADMIN.email)
    cy.visit(`/participants/edit/${TestUsers.PARTICIPANT_UNANSWERED.id}`)
    cy.contains('Edit Participant').should('exist')
    cy.get('input[name="profile.postcode"]')
      .clear()
      .type("{{7*7}}<script>alert('xss-postcode')</script>", {
        parseSpecialCharSequences: false,
      })
    cy.contains('Save').click()
    cy.contains(VALIDATION_MESSAGES.POSTCODE_INVALID).should('exist')
  })

  it('Edit participant, validate xss mobile', () => {
    cy.login(TestUsers.ORG_ADMIN.email)
    cy.visit(`/participants/edit/${TestUsers.PARTICIPANT_UNANSWERED.id}`)
    cy.contains('Edit Participant').should('exist')
    cy.get('input[name="profile.mobile"]')
      .clear()
      .type("{{7*7}}<script>alert('xss-mobile')</script>", {
        parseSpecialCharSequences: false,
      })
    cy.contains('Save').click()
    cy.contains(VALIDATION_MESSAGES.MOBILE_INVALID).should('exist')
  })

  it('Edit participant, validate xss nok first name', () => {
    cy.login(TestUsers.ORG_ADMIN.email)
    cy.visit(`/participants/edit/${TestUsers.PARTICIPANT_UNANSWERED.id}`)
    cy.contains('Edit Participant').should('exist')
    cy.get('input[name="profile.nextOfKin.firstName"]')
      .clear()
      .type("{{7*7}}<script>alert('xss-nok-first-name')</script>", {
        parseSpecialCharSequences: false,
      })
    cy.contains('Save').click()
    cy.contains(VALIDATION_MESSAGES.NAME_INVALID).should('exist')
  })

  it('Edit participant, validate xss nok last name', () => {
    cy.login(TestUsers.ORG_ADMIN.email)
    cy.visit(`/participants/edit/${TestUsers.PARTICIPANT_UNANSWERED.id}`)
    cy.contains('Edit Participant').should('exist')
    cy.get('input[name="profile.nextOfKin.lastName"]')
      .clear()
      .type("{{7*7}}<script>alert('xss-nok-last-name')</script>", {
        parseSpecialCharSequences: false,
      })
    cy.contains('Save').click()
    cy.contains(VALIDATION_MESSAGES.NAME_INVALID).should('exist')
  })

  it('Edit participant, validate xss nok email', () => {
    cy.login(TestUsers.ORG_ADMIN.email)
    cy.visit(`/participants/edit/${TestUsers.PARTICIPANT_UNANSWERED.id}`)
    cy.contains('Edit Participant').should('exist')
    cy.get('input[name="profile.nextOfKin.email"]')
      .clear()
      .type("{{7*7}}<script>alert('xss-nok-email')</script>@gmail.com", {
        parseSpecialCharSequences: false,
      })
    cy.contains('Save').click()
    cy.contains(VALIDATION_MESSAGES.EMAIL_INVALID).should('exist')
  })

  it('Edit participant, validate xss nok mobile', () => {
    cy.login(TestUsers.ORG_ADMIN.email)
    cy.visit(`/participants/edit/${TestUsers.PARTICIPANT_UNANSWERED.id}`)
    cy.contains('Edit Participant').should('exist')
    cy.get('input[name="profile.nextOfKin.mobile"]')
      .clear()
      .type("{{7*7}}<script>alert('xss-nok-mobile')</script>", {
        parseSpecialCharSequences: false,
      })
    cy.contains('Save').click()
    cy.contains(VALIDATION_MESSAGES.MOBILE_INVALID).should('exist')
  })
})
