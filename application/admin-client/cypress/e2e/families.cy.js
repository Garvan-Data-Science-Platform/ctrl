/// <reference types="cypress" />

const { UserType } = require('../support/commands')

beforeEach(() => {
  cy.task('reset')
  cy.login(UserType.ADMIN)
})

describe('Family Editing', () => {
  function addDep() {
    cy.get('[data-cy="add-member-button"]').click()
    cy.get('[data-cy="registered-no"]').click()
    cy.get('[data-cy="new-dependent"]').click()
    cy.get('[data-cy="dep-first"]').type('Jonny')
    cy.get('[data-cy="dep-surname"]').type('Tester')
    cy.get('[data-cy="dep-dob"]').type('2020-01-01')
    cy.get('[data-cy="add-dep-button"]').click()
  }

  it('View family', () => {
    cy.visit('/participants')
    cy.get('[data-cy="family-button"]').first().click()
  })

  it('Add registered participant to family', () => {
    cy.visit('/participants/family/edit/1')
    cy.get('[data-cy="add-member-button"]').click()
    cy.get('[data-cy="registered-yes"]').click()
    cy.get('[data-cy="participant-list"]').get('li').should('have.length', 3)
    cy.get('[data-cy="search-first"]').type('Second')
    cy.get('[data-cy="participant-list"]').get('li').should('have.length', 1).click()
    cy.get('[data-cy="search-confirm-button"]').click()
    cy.get('[data-cy="current-family-members"]').contains('Second Guardian').should('exist')
  })

  it('Add new dependent to family', () => {
    cy.visit('/participants/family/edit/100')
    addDep()
    cy.get('[data-cy="current-family-members"]').contains('Jonny Tester').should('exist')
    cy.get('[data-cy="in-study-checkbox"] input').last().should('be.checked')
  })

  it('Remove member from family', () => {
    cy.visit('/participants/family/edit/100')
    cy.get('[data-cy="remove-member-button"]').click()
    cy.get('[data-cy="remove-icon-button"]').should('have.length', 3).first().click()
    cy.get('[data-cy="current-family-members"]').contains('Test User').should('not.exist')
  })

  it('Change family member status', () => {
    cy.visit('/participants/family/edit/100')
    cy.get('[data-cy="type-select"]').first().click()
    cy.contains('Non-Guardian').click()
    cy.visit('/participants/family/edit/100')
    cy.contains('Non-Guardian').should('be.visible')
  })

  it('Remove family member from study, add them back in', () => {
    cy.visit('/participants/family/edit/100')
    cy.get('[data-cy="in-study-checkbox"]').first().click()
    cy.contains('Removed').should('exist')
    cy.visit('/responses/all/1')
    cy.contains('Completed User').should('not.exist')
    cy.visit('/participants/family/edit/100')
    cy.get('[data-cy="in-study-checkbox"]').last().click()
    cy.contains('Added').should('exist')
  })

  it('If changing study and no family members are in current study, redirect to participants page', () => {
    cy.visit('/participants/family/edit/100')
    cy.get('[data-cy="study-dropdown"]').click()
    cy.contains('Study 2').click()
    cy.url().should('not.contain', 'family')
  })

  it('Cannot make changes that would leave orphan dependent', () => {
    cy.visit('/participants/family/edit/100')
    cy.get('[data-cy="type-select"]').first().click()
    cy.contains('Non-Guardian').click()
    cy.get('[data-cy="type-select"]').eq(2).click()
    cy.get('[data-value="STANDARD"]').click()
    cy.contains('no guardian').should('exist')
    cy.contains('no guardian').should('not.exist')
    cy.get('[data-cy="in-study-checkbox"]').last().click()
    cy.contains('no guardian').should('exist')
    cy.contains('no guardian').should('not.exist')
    cy.get('[data-cy="remove-member-button"]').click()
    cy.get('[data-cy="remove-icon-button"]').last().click()
    cy.contains('no guardian').should('exist')
    cy.visit('/participants/family/edit/1')
    addDep()
    cy.contains('At least one').should('exist')
    cy.visit('/participants/family/edit/1')
    cy.get('[data-cy="type-select"]').click()
    cy.contains('Dependent (other)').click()
    cy.contains('no guardian').should('exist')
  })
})
