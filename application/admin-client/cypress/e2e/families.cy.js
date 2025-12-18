/// <reference types="cypress" />

const { UserType } = require('../../../common/cypress/support/commands')

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
    cy.get('[data-cy="remove-icon-button"]').should('have.length', 2).first().click()
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
    //Removing a family member who is part of multiple studies properly removes them from the answers list
    cy.visit('/participants/family/edit/1')
    cy.contains('Unanswered').should('exist')
    cy.get('[data-cy="in-study-checkbox"]').first().click()
    cy.get('[data-cy="confirm-remove"]').click()
    cy.visit('/responses/all/1')
    cy.get('[data-cy="display-sensitive"]').click()
    cy.contains('Survey Version 1').should('exist')
    cy.contains('Test Dependent').should('exist')
    cy.contains('Unanswered').should('not.exist')

    cy.visit('/participants/family/edit/100')
    cy.get('[data-cy="in-study-checkbox"]').first().click()
    cy.get('[data-cy="confirm-remove"]').click()
    cy.contains('Removed').should('exist')
    cy.visit('/responses/all/1')
    cy.get('[data-cy="display-sensitive"]').click()
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
    //Can't change participant type
    cy.visit('/participants/family/edit/100')
    cy.contains('tr', 'Completed User').find('[data-cy="type-select"]').click()
    cy.contains('Non-Guardian').click()
    cy.contains('tr', 'Second Guardian').find('[data-cy="type-select"]').click()
    cy.get('[data-value="STANDARD"]').click()
    cy.contains('no guardian').should('exist')
    cy.contains('no guardian').should('not.exist')
    //Can't remove from study
    cy.contains('tr', 'Second Guardian').find('[data-cy="in-study-checkbox"]').click()
    cy.get('[data-cy="confirm-remove"]').click()
    cy.contains('no guardian').should('exist')
    cy.contains('no guardian').should('not.exist')
    //Can't remove from family
    cy.get('[data-cy="remove-member-button"]').click()
    cy.contains('tr', 'Second Guardian').find('[data-cy="remove-icon-button"]').click()
    cy.contains('no guardian').should('exist')
    //Can't add a dependent to a family with no guardian
    cy.visit('/participants/family/edit/1')
    addDep()
    cy.contains('At least one').should('exist')
    //Can't change type to dependent if there is no guardian
    cy.visit('/participants/family/edit/1')
    cy.get('[data-cy="type-select"]').click()
    cy.contains('Dependent (other)').click()
    cy.contains('no guardian').should('exist')
    cy.contains('no guardian').should('not.exist')
    //Can't bring in a dependent to a family with no guardian
    cy.get('[data-cy="add-member-button"]').click()
    cy.get('[data-cy="registered-yes"]').click()
    cy.get('[data-cy="search-first"]').type('Test')
    cy.get('[data-cy="participant-list"]').get('li').should('have.length', 1).click()
    cy.get('[data-cy="search-confirm-button"]').click()
    cy.contains('Cannot add').should('exist')
    cy.contains('Cannot add').should('not.exist')
    //Can't bring in a guardian from a family with a dependent and no other guardian
    cy.get('[data-cy="search-first"]').clear().type('Second')
    cy.get('[data-cy="participant-list"]').get('li').should('have.length', 1).click()
    cy.get('[data-cy="search-confirm-button"]').click()
    cy.contains('only guardian').should('exist')
  })
})
