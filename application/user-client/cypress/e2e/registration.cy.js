/// <reference types="cypress" />
const { TestUsers, TestInvites, TestStudies } = require('../../../common/testing/constants')

beforeEach(() => {
  cy.task('reset')
})

describe('registration', () => {
  function fillValid() {
    cy.wait(500) // wait for form to be fully loaded
    cy.get('[data-cy="reg-first"]').type('FIRST')
    cy.get('[data-cy="reg-last"]').type('LAST')
    cy.get('[data-cy="reg-email"]').type(TestInvites.INVITE_PENDING.email)
    cy.get('[data-cy="reg-password"]').type('Aadsfoswefw1515fd@!')
    cy.get('[data-cy="reg-confirm-password"]').type('Aadsfoswefw1515fd@!')
    cy.get('[data-cy="reg-dob"]').type('1990-01-01')
    cy.get('[data-cy="reg-address-line"]').type('1 Smith St')
    cy.get('[data-cy="reg-suburb"]').type('Smithville')
    cy.get('[data-cy="reg-state"]').click()
    cy.contains('VIC').click()
    cy.get('[data-cy="reg-postcode"]').type('1234')
    cy.get('[data-cy="reg-mobile"]').type('0412345678')
    cy.get('[data-cy="reg-contact-method"]').click()
    cy.get('[data-value="EMAIL"]').click()
    cy.get('[data-cy="nok-first"]').type('ALT')
    cy.get('[data-cy="nok-surname"]').type('LAST')
    cy.get('[data-cy="nok-email"]').type('alt@email.com')
    cy.get('[data-cy="terms"] input').click()
  }

  it('open registration page and register a user', () => {
    cy.task('getInviteIdtask', {
      email: TestInvites.INVITE_PENDING.email,
      studyId: TestStudies.TEST_STUDY.id,
    })
      .as('inviteId')
      .then((inviteId) => {
        cy.visit(`/register/${inviteId}`)
      })
    fillValid()
    cy.get('[data-cy="reg-button"]').click()
    cy.contains('Welcome FIRST').should('exist')
  })

  it('Enter some fields, try to register and empty field is focused', () => {
    cy.task('getInviteIdtask', {
      email: TestInvites.INVITE_PENDING.email,
      studyId: TestStudies.TEST_STUDY.id,
    })
      .as('inviteId')
      .then((inviteId) => {
        cy.visit(`/register/${inviteId}`)
      })
    cy.get('[data-cy="reg-first"]').type('BOB')
    cy.get('[data-cy="reg-button"]').click()
    cy.get('[data-cy="reg-last"] input').should('be.focused')
  })

  it('Input some invalid data and get correct error messages', () => {
    cy.task('getInviteIdtask', {
      email: TestInvites.INVITE_PENDING.email,
      studyId: TestStudies.TEST_STUDY.id,
    })
      .as('inviteId')
      .then((inviteId) => {
        cy.visit(`/register/${inviteId}`)
      })
    cy.get('[data-cy="reg-password"]').type('ABC')
    cy.get('[data-cy="reg-confirm-password"]').type('A')
    cy.get('[data-cy="reg-postcode"]').type('AB13')
    cy.get('[data-cy="reg-mobile"]').type('04123')
    cy.get('[data-cy="reg-button"]').click()
    cy.contains('Invalid password').should('exist')
    cy.contains('Invalid postcode').should('exist')
    cy.contains('Mobile number contains invalid characters').should('exist')
    cy.contains('at least 14 characters').should('exist')
    cy.contains('passwords do not match').should('exist')
  })

  it('Input an invalid password and get correct error messages', () => {
    cy.task('getInviteIdtask', {
      email: TestInvites.INVITE_PENDING.email,
      studyId: TestStudies.TEST_STUDY.id,
    })
      .as('inviteId')
      .then((inviteId) => {
        cy.visit(`/register/${inviteId}`)
      })
    cy.get('[data-cy="reg-password"]').type('Testpassword1')
    cy.get('[data-cy="reg-confirm-password"]').type('Testpassword1')
    cy.get('[data-cy="reg-button"]').click()
    cy.contains('Invalid password').should('exist')
    cy.contains('must not contain easily guessable words').should('exist')
  })

  it('Input xss-themed invalid data and get correct error messages', () => {
    cy.task('getInviteIdtask', {
      email: TestInvites.INVITE_PENDING.email,
      studyId: TestStudies.TEST_STUDY.id,
    })
      .as('inviteId')
      .then((inviteId) => {
        cy.visit(`/register/${inviteId}`)
      })
    cy.get('[data-cy="reg-first"]').type("\{\{7*7}}<script>alert('xss-firstname')</script>$#", {
      parseSpecialCharSequences: false,
    })
    cy.get('[data-cy="reg-last"]').type("{{7*7}}<script>alert('xss-lastname')</script>$#", {
      parseSpecialCharSequences: false,
    })
    cy.get('[data-cy="reg-email"]').type(TestInvites.INVITE_PENDING.email)
    cy.get('[data-cy="reg-password"]').type('Aadsfoswefw1515fd@!')
    cy.get('[data-cy="reg-confirm-password"]').type('Aadsfoswefw1515fd@!')
    cy.get('[data-cy="reg-dob"]').type('1990-01-01')
    cy.get('[data-cy="reg-address-line"]').type("{{7*7}}<script>alert('xss-address')</script>$#", {
      parseSpecialCharSequences: false,
    })
    cy.get('[data-cy="reg-suburb"]').type("{{7*7}}<script>alert('xss-suburb')</script>$#", {
      parseSpecialCharSequences: false,
    })
    cy.get('[data-cy="reg-state"]').click()
    cy.contains('VIC').click()
    cy.get('[data-cy="reg-postcode"]').type("<script>alert('xss-postcode')</script>", {
      parseSpecialCharSequences: false,
    })
    cy.get('[data-cy="reg-mobile"]').type('<script>0412345678</script>')
    cy.get('[data-cy="reg-contact-method"]').click()
    cy.get('[data-value="EMAIL"]').click()
    cy.get('[data-cy="nok-first"]').type("{{7*7}}<script>alert('xss-nok-firstname')</script>$#", {
      parseSpecialCharSequences: false,
    })
    // hit enter after the last form field
    // NOK email seems to have it's own xss protection in electron
    cy.get('[data-cy="nok-surname"]')
      .type("{{7*7}}<script>alert('xss-nok-surname')</script>$#", {
        parseSpecialCharSequences: false,
      })
      .type('{enter}')

    cy.contains('Name contains invalid characters').should('exist')
    cy.contains('Address contains invalid characters').should('exist')
    cy.contains('Mobile number contains invalid characters').should('exist')
    cy.contains('Invalid postcode').should('exist')
  })

  it('Attempt to register existing email (i.e. no invite) and get correct error message', () => {
    cy.visit('/register/not-a-real-inviteId')
    fillValid()
    const testEmail = TestUsers.STUDY_ADMIN.email
    cy.get('[data-cy="reg-email"]').clear()
    cy.get('[data-cy="reg-email"]').type(testEmail)
    cy.get('[data-cy="reg-button"]').click()
    cy.contains(`Invite for ${testEmail} not found`).should('exist')
  })

  it('Add dependents, check errors and valid submission', () => {
    cy.task('getInviteIdtask', {
      email: TestInvites.INVITE_PENDING.email,
      studyId: TestStudies.TEST_STUDY.id,
    })
      .as('inviteId')
      .then((inviteId) => {
        cy.visit(`/register/${inviteId}`)
      })
    fillValid()
    cy.get('[data-cy="add-dependent"]').click()
    cy.get('[data-cy="reg-button"]').click()
    cy.contains('This field is required').should('exist')
    cy.get('[data-cy="add-dependent"]').click()
    cy.get('[data-cy=dep-first]').eq(1).type('JNR')
    cy.get('[data-cy=dep-surname]').eq(1).type('LAST')
    cy.get('[data-cy="dep-dob"]').eq(1).type('2020-01-01')
    cy.get('[data-cy="dep-delete"]').first().click()
    cy.get('[data-cy="reg-button"]').click()
    cy.contains('Welcome FIRST').should('exist')
    cy.contains('Step 2').should('exist')
  })

  it('Add dependents with xss, check errors', () => {
    cy.task('getInviteIdtask', {
      email: TestInvites.INVITE_PENDING.email,
      studyId: TestStudies.TEST_STUDY.id,
    })
      .as('inviteId')
      .then((inviteId) => {
        cy.visit(`/register/${inviteId}`)
      })
    fillValid()
    cy.get('[data-cy="add-dependent"]').click()
    cy.get('[data-cy=dep-first]').type("{{7*7}}<script>alert('xss-dep-first')</script>$#", {
      parseSpecialCharSequences: false,
    })
    cy.get('[data-cy="dep-dob"]').type('2020-01-01')
    cy.get('[data-cy=dep-surname]')
      .type("{{7*7}}<script>alert('xss-dep-surname')</script>$#", {
        parseSpecialCharSequences: false,
      })
      .type('{enter}')
    cy.contains('Name contains invalid characters').should('exist')
  })
})
