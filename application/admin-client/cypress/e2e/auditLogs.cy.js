const { TestUsers } = require('../../../common/testing/constants')

before(() => {
  cy.task('reset')
  cy.task('seedAuditLogs', 55)
})

// Note: I've decided against testing the sorting and pagination as this comes from the library

describe('Audit Logs', () => {
  it('Organisation Admin can view Audit Log', () => {
    cy.login(TestUsers.ORG_ADMIN.email)
    cy.visit('/audit-logs')
    cy.contains('Audit Logs').should('exist')
  })

  it('Study Amin can view Audit Log', () => {
    cy.login(TestUsers.STUDY_ADMIN.email)
    cy.visit('/audit-logs')
    cy.contains('Audit Logs').should('exist')
  })

  it('should toggle the View Payload cell and display JSON', () => {
    cy.login(TestUsers.STUDY_ADMIN.email)
    cy.visit('/audit-logs')

    // Toggle button to view payload
    cy.get('[data-cy="toggle-payload-view"]').first().should('contain.text', 'View Payload').click()

    // Assert text changes
    cy.get('[data-cy="toggle-payload-view"]').first().should('contain.text', 'Hide Payload')

    // Assert JSON appears
    // Note: this works because the most recent action is the Study Admin
    //       logging in at the start of the test :)
    cy.get('.MuiCollapse-root')
      .should('be.visible')
      .and('contain.text', TestUsers.STUDY_ADMIN.email)

    // Toggle button to hide payload
    cy.get('[data-cy="toggle-payload-view"]').first().should('contain.text', 'Hide Payload').click()

    cy.get('[data-cy="toggle-payload-view"]').first().should('contain.text', 'View Payload')

    cy.get('[data-cy="payload-viewer"]').should('not.exist')
  })

  it('should obscure password fields in JSON payload', () => {
    cy.login(TestUsers.STUDY_ADMIN.email)
    TestUsers.TestUsers
    cy.visit('/audit-logs')

    // Toggle button to view payload
    cy.get('[data-cy="toggle-payload-view"]').first().should('contain.text', 'View Payload').click()

    // Ensure password is obscured (double escapes required)
    cy.get('.MuiCollapse-root').should('contain.text', '\\"password\\":\\"***\\"')
  })

  it('should obscure redcapToken fields in JSON payload', () => {
    cy.login(TestUsers.STUDY_ADMIN.email)
    cy.visit('/studies')
    cy.get('[data-cy="advanced-toggle"]').eq(0).click()
    cy.get('[data-cy="redcapToken"] input').eq(0).type('abc123')
    cy.get('[data-cy="settings-apply"]').eq(0).click()

    cy.visit('/audit-logs')

    // Toggle button to view payload
    cy.get('[data-cy="toggle-payload-view"]').first().should('contain.text', 'View Payload').click()

    // Ensure token is obscured (double escapes required)
    cy.get('.MuiCollapse-root').should('contain.text', '\\"redcapToken\\":\\"***\\"')
  })
})
