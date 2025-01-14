/// <reference types="cypress" />

beforeEach(() => {
  cy.task('reset')
})

describe('registration', () => {
  function fillValid() {
    cy.get('[data-cy="reg-first"]').type('FIRST')
    cy.get('[data-cy="reg-last"]').type('LAST')
    cy.get('[data-cy="reg-email"]').type('valid@email.com')
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
    cy.contains('EMAIL').click()
    cy.get('[data-cy="nok-first"]').type('ALT')
    cy.get('[data-cy="nok-surname"]').type('LAST')
    cy.get('[data-cy="nok-email"]').type('alt@email.com')
  }

  it('open registration page and register a user', () => {
    cy.visit('/register')
    fillValid()
    cy.get('[data-cy="reg-button"]').click()
    cy.contains('Welcome FIRST').should('exist')
  })

  it('Enter some fields, try to register and empty field is focused', () => {
    cy.visit('/register')
    cy.get('[data-cy="reg-first"]').type('BOB')
    cy.get('[data-cy="reg-button"]').click()
    cy.get('[data-cy="reg-last"] input').should('be.focused')
  })

  it('Input some invalid data and get correct error messages', () => {
    cy.visit('/register')
    cy.get('[data-cy="reg-password"]').type('ABC')
    cy.get('[data-cy="reg-confirm-password"]').type('A')
    cy.get('[data-cy="reg-postcode"]').type('AB13')
    cy.get('[data-cy="reg-mobile"]').type('04123')
    cy.get('[data-cy="reg-button"]').click()
    cy.contains('Invalid password').should('exist')
    cy.contains('Invalid postcode').should('exist')
    cy.contains('Invalid mobile number').should('exist')
    cy.contains('at least 8 characters').should('exist')
    cy.contains('passwords do not match').should('exist')
  })
  it('Attempt to register existing email and get correct error message', () => {
    cy.visit('/register')
    fillValid()
    cy.get('[data-cy="reg-email"]').clear()
    cy.get('[data-cy="reg-email"]').type('test1@example.com')
    cy.get('[data-cy="reg-button"]').click()
    cy.contains('email already in use').should('exist')
  })

  it('Add dependents, check errors and valid submission', () => {
    cy.visit('/register')
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
})
