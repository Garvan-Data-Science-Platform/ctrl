/// <reference types="cypress" />

const { UserType } = require('../../../common/cypress/support/commands')

beforeEach(() => {
  cy.task('reset')
})

describe('Participants', () => {
  it('List participants', () => {
    cy.login(UserType.ADMIN)
    cy.visit('/participants')
    cy.contains('Test').should('exist')
    cy.contains('Dependent').should('exist')
    cy.contains('V1').should('exist')
  })
  it('View participant details', () => {
    cy.login(UserType.ADMIN)
    cy.visit('/participants/98')
    cy.contains('Unanswered User').should('exist')
    cy.contains('123 smith st').should('exist')
    cy.contains('V1').should('exist')
    cy.visit('/participants/99')
    cy.contains('Family').should('exist')
    cy.contains('Dependent').should('exist')
  })

  it('Edit participant details', () => {
    cy.login(UserType.ADMIN)
    cy.visit('/participants/edit/98')
    cy.contains('Edit Participant').should('exist')
    cy.get('input[name="profile.addressLine"]').clear().type('1 Smith St')
    cy.get('input[name="profile.nextOfKin.firstName"]').clear().type('Betty')
    cy.get('input[name="profile.postcode"]').clear().type('222a')
    cy.get('input[name="externalId"]').clear().type('extID')
    cy.contains('Save').click()
    cy.contains('Invalid postcode').should('exist')
    cy.get('input[name="profile.postcode"]').clear().type('2222')
    cy.get('input[name="profile.nextOfKin.email"]').clear().type('invalid')
    cy.contains('Save').click()
    cy.contains('Invalid email').should('exist')
    cy.get('input[name="profile.nextOfKin.email"]').clear().type('valid@email.com')
    cy.contains('Save').click()
    cy.url().should('contain', 'participants/98')
    cy.contains('Betty').should('exist')
    cy.contains('extID').should('exist')
    cy.contains('1 Smith St').should('exist')
  })

  it('View answers', () => {
    cy.login(UserType.ADMIN)
    cy.visit('/participants')
    cy.get('[data-rowindex="0"]').contains('V1').trigger('mouseover', { force: true })
    cy.contains('Incomplete').should('be.visible')
    cy.get('[data-rowindex="1"]').contains('V1').trigger('mouseover', { force: true })
    cy.contains('Complete').should('be.visible')
    cy.get('[data-rowindex="1"]').contains('V1').click({ force: true })
    cy.contains('false').should('exist')
  })

  it('Shows completed and partially completed surveys', () => {
    cy.login(UserType.ADMIN)
    cy.visit('/participants')
    cy.get('[data-rowindex="0"]').contains('V1').trigger('mouseover', { force: true })
    cy.contains('Incomplete').should('be.visible')
    cy.task('partialComplete')
    cy.visit('/participants')
    cy.get('[data-rowindex="2"]').contains('V1').trigger('mouseover', { force: true })
    cy.contains('Incomplete').should('be.visible')
  })
})
