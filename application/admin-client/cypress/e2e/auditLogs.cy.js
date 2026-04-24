const { UserType } = require('../../../common/cypress/support/commands')

before(() => {
  cy.task('reset')
  cy.task('seedAuditLogs', 55)
})

// Note: I've decided against testing the sorting and pagination as this comes from the library

describe('Audit Logs', () => {
  it('Organisation Admin can view Audit Log', () => {
    cy.login(UserType.ORG_ADMIN)
    cy.visit('/audit-logs')
    cy.contains('Audit Logs').should('exist')
  })

  it('Study Amin can view Audit Log', () => {
    cy.login(UserType.STUDY_ADMIN)
    cy.visit('/audit-logs')
    cy.contains('Audit Logs').should('exist')
  })

  it('should toggle the View Payload cell and display JSON', () => {
    cy.login(UserType.STUDY_ADMIN)
    cy.visit('/audit-logs')

    // Toggle button to view payload
    cy.get('[data-cy="toggle-payload-view"]').first().should('contain.text', 'View Payload').click()

    // Assert text changes
    cy.get('[data-cy="toggle-payload-view"]').first().should('contain.text', 'Hide Payload')

    // Assert JSON appears
    // Note: this works because the most recent action is the Study Admin
    //       logging in at the start of the test :)
    cy.get('.MuiCollapse-root').should('be.visible').and('contain.text', UserType.STUDY_ADMIN)

    // Toggle button to hide payload
    cy.get('[data-cy="toggle-payload-view"]').first().should('contain.text', 'Hide Payload').click()

    cy.get('[data-cy="toggle-payload-view"]').first().should('contain.text', 'View Payload')

    cy.get('[data-cy="payload-viewer"]').should('not.exist')
  })
})
