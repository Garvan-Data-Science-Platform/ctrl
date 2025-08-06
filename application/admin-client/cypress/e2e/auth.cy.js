/// <reference types="cypress" />

const { UserType } = require('../support/commands')

beforeEach(() => {
  cy.task('reset')
})

describe('auth', () => {
  it('renders login page', () => {
    cy.visit('/')
    cy.contains('Sign in to your account').should('exist')
    cy.get('[data-cy="oidc-img"]').should('not.exist')
  })

  it('can login as admin to the admin portal', () => {
    cy.visit('/')
    cy.get('input[name="email"]').type(UserType.ADMIN)
    cy.get('input[name="password"]').type('password')
    cy.get('button[type="submit"]').click()
    cy.url().should('include', '/users') // Redirects to /users after login
  })

  it('cannot login as a participant to the admin portal', () => {
    cy.visit('/')
    cy.get('input[name="email"]').type(UserType.PARTICIPANT_COMPLETED)
    cy.get('input[name="password"]').type('password')
    cy.get('button[type="submit"]').click()

    // Expect to stay on the login page & error message popup
    cy.url().should('not.include', '/users')
    cy.contains('admin privileges').should('exist')
  })

  it('can use oidc login and disable password login', () => {
    cy.intercept('*/setup', {
      isSetup: true,
      oidc: [
        {
          name: 'aaf',
          host: 'https://test.cilogon.aaf.edu.au',
          clientId: 'cilogon:/client_id/19130a96af2ad9eb0d22a6c253a3d2aa',
          icon: 'https://aaf.edu.au/wp-content/uploads/AAF_LGO_small-website.png',
        },
      ],
      disableAdminPasswordLogin: true,
    })
    cy.intercept('**/oidc', {
      token: 'dummy_token',
    })
    cy.intercept('**/studies').as('studyReq')
    cy.visit('/')
    cy.get('input[name="email"]').should('not.exist')
    cy.get('[data-cy="oidc-img"]').should('exist')
    cy.visit('/login/callback?code=123&state=aaf')
    cy.wait('@studyReq').then((int) => {
      expect(int.request.headers['authorization']).equal('Bearer dummy_token')
    })
  })
})
