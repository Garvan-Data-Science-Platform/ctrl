/// <reference types="cypress" />

const { UserType } = require('../support/commands')

beforeEach(() => {
  cy.task('reset')
})

describe('Survey Editor', () => {
  it('Edit title and description', () => {
    cy.login(UserType.ADMIN)
    cy.visit('/surveys')
    cy.get('[data-rowindex="0"]').contains('Current Draft').should('exist')
    cy.get('[data-rowindex="0"] button').click()
    cy.contains('Survey Steps').should('exist')
    cy.wait(500)
    cy.get('[data-cy="step-title"]').type('123')
    cy.get('[data-cy="step-description"]').type('123')
    cy.get('[data-cy="publish-button"]').should('be.disabled')
    cy.get('[data-cy="publish-button"]').should('not.be.disabled')
    cy.reload()
    cy.get('[data-cy="step-title"] input').should('have.value', 'Intro123')
  })

  it('Add, delete and rearrange questions', () => {
    cy.login(UserType.ADMIN)
    cy.visit('/surveys/edit/2')
    cy.contains('Checkbox').click()
    cy.contains('Mandatory').should('exist')
    cy.get('[data-testid="DeleteIcon"]').eq(1).click()
    cy.contains('Mandatory').should('not.exist')
    cy.contains('Multi-choice').click()
    cy.get('[data-cy="choices-box"]').children('button').click().click()
    cy.get('[data-cy="choices-box"]').children('div').should('have.length', 2)
    cy.get('[data-cy="choices-box"]').children('div').first().find('button').click()
    cy.get('[data-cy="choices-box"]').children('div').should('have.length', 1)
    cy.contains('Subheading').click()
    //Move last element to start
    cy.get('[data-cy="drag-handle"]').last().trigger('dragstart')
    cy.get('[data-cy="drop-zone"]').first().trigger('drop')
    cy.get('[data-cy="survey-element"]').first().contains('Subheading').should('exist')
    //Check nothing happens when dragging up
    cy.get('[data-cy="drag-handle"]').first().trigger('dragstart')
    cy.get('[data-cy="drop-zone"]').first().trigger('drop')
    cy.get('[data-cy="survey-element"]').first().contains('Subheading').should('exist')
    //Move it to the bottom
    cy.get('[data-cy="drag-handle"]').first().trigger('dragstart')
    cy.get('[data-cy="drop-zone"]').last().trigger('drop')
    cy.get('[data-cy="survey-element"]').last().contains('Subheading').should('exist')
    //Check nothing happens when dragging down
    cy.get('[data-cy="drag-handle"]').last().trigger('dragstart')
    cy.get('[data-cy="drop-zone"]').last().trigger('drop')
    cy.get('[data-cy="survey-element"]').last().contains('Subheading').should('exist')
    //Move to second position
    cy.get('[data-cy="drag-handle"]').last().trigger('dragstart')
    cy.get('[data-cy="drop-zone"]').eq(1).trigger('drop')
    cy.get('[data-cy="survey-element"]').eq(1).contains('Subheading').should('exist')
    //Check nothing happens when dragging to space above and below
    cy.get('[data-cy="drag-handle"]').eq(1).trigger('dragstart')
    cy.get('[data-cy="drop-zone"]').eq(1).trigger('drop')
    cy.get('[data-cy="survey-element"]').eq(1).contains('Subheading').should('exist')
    cy.get('[data-cy="drag-handle"]').eq(1).trigger('dragstart')
    cy.get('[data-cy="drop-zone"]').eq(2).trigger('drop')
    cy.get('[data-cy="survey-element"]').eq(1).contains('Subheading').should('exist')
  })
  it('Add, delete and rearrange steps', () => {
    cy.login(UserType.ADMIN)
    cy.visit('/surveys/edit/2')
    cy.get('[data-cy="options-button"]').should('not.be.disabled').click()
    cy.contains('step up').should('have.class', 'Mui-disabled')
    cy.contains('Delete').click()
    cy.get('[data-cy="step-list"]').children().should('have.length', 1)
    cy.contains('SUBHEADING').should('exist')
    cy.contains('New Step').click()
    cy.get('[data-cy="step-list"]').children().should('have.length', 2)
    cy.contains('Step 2').click()
    cy.get('[data-cy="options-button"]').click()
    cy.contains('step down').click()
    cy.get('[data-cy="step-list"]').children().first().contains('New Step').should('exist')
  })
  it('Publish', () => {
    cy.login(UserType.ADMIN)
    cy.visit('/surveys/edit/2')
    cy.contains('Publish').click()
    cy.contains('new version').should('exist')
    cy.contains('Cancel').click()
    cy.contains('new version').should('not.exist')
    cy.contains('Publish').click()
    cy.get('[data-cy="publish-confirm"]').click()
    cy.contains('2').should('exist')
  })

  it('DUO Code Lookup', () => {
    cy.login(UserType.ADMIN)
    cy.visit('/surveys/edit/2')
    cy.contains('Step 2').click()

    //DUO for checkbox question
    cy.get('[data-cy="advanced-toggle"]').eq(0).click()
    cy.get('[data-cy="add-duo"]').eq(0).click()
    cy.get('[data-cy="duo-filter"]').type('biomed')
    cy.get('[data-cy="duo-results"] li').should('have.length', 2).first().click()
    cy.get('[data-cy="confirm-duo"]').should('be.disabled')
    cy.get('[data-cy="duo-answer"]').click()
    cy.contains('false').click()
    cy.get('[data-cy="confirm-duo"]').should('be.enabled').click()
    cy.contains('health or').should('exist')
    cy.contains('non-commercial').should('exist')

    //Remove DUO Code

    cy.contains('non-biomed').should('not.exist')
    cy.get('[data-cy="advanced-toggle"]').eq(0).click()
    cy.get('[data-cy="advanced-toggle"]').eq(1).click()
    cy.get('[data-cy="duo-chip"] svg').eq(2).click()
    cy.get('[data-cy="add-duo"]').eq(1).click()
    cy.get('[data-cy="duo-results"] li').first().click()
    cy.get('[data-cy="confirm-duo"]').should('be.disabled')
    cy.get('[data-cy="duo-answer"]').click()
    cy.contains('Choice 1').click()
    cy.get('[data-cy="confirm-duo"]').should('be.enabled').click()
    cy.contains('non-bio').should('exist')
    //Editing choice will remove the duo code
    cy.get('[data-cy="choice-text"]').first().type('B')
    cy.contains('non-commercial').should('not.exist')
  })
})
