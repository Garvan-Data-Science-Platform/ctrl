/// <reference types="cypress" />

const { TestUsers } = require('../../../common/testing/constants')

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
    cy.get('input[name="email"]').type(TestUsers.ORG_ADMIN.email)
    cy.get('input[name="password"]').type(TestUsers.ORG_ADMIN.password)
    cy.get('button[type="submit"]').click()
    cy.url().should('include', '/surveys') // Redirects to /surveys after login
  })

  it('cannot login as a participant to the admin portal', () => {
    cy.visit('/')
    cy.get('input[name="email"]').type(TestUsers.PARTICIPANT_COMPLETED.email)
    cy.get('input[name="password"]').type(TestUsers.PARTICIPANT_COMPLETED.password)
    cy.get('button[type="submit"]').click()

    // Expect to stay on the login page & error message popup
    cy.url().should('not.include', '/surveys')
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
          displayInAdminPortal: true,
          displayInUserPortal: true,
        },
      ],
      disableAdminPasswordLogin: true,
    })
    cy.intercept('**/oidc', {
      token: 'dummy_token',
      id: 1,
      role: 'Participant',
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

  it('persists user role after oidc login', () => {
    let TOKEN = 'dummy_oidc_token'
    let ROLE = 'OrganisationAdmin'
    let ID = '5'

    cy.intercept('*/setup', {
      isSetup: true,
      oidc: [
        {
          name: 'aaf',
          host: 'https://test.cilogon.aaf.edu.au',
          clientId: 'cilogon:/client_id/19130a96af2ad9eb0d22a6c253a3d2aa',
          icon: 'https://aaf.edu.au/wp-content/uploads/AAF_LGO_small-website.png',
          displayInAdminPortal: true,
          displayInUserPortal: true,
        },
      ],
      disableAdminPasswordLogin: true,
    })

    // Mock the OIDC exchange to return role alongside token
    cy.intercept('**/oidc', {
      token: TOKEN,
      role: ROLE,
      id: ID,
    }).as('oidcTokenExchange')

    cy.visit('/login/callback?code=123&state=aaf')

    cy.wait('@oidcTokenExchange')

    // Assert that the Role made it into LocalStorage
    cy.window().then((window) => {
      expect(window.localStorage.getItem('refine-auth')).to.eq(TOKEN)
      expect(window.localStorage.getItem('userrole')).to.eq(ROLE)
      expect(window.localStorage.getItem('userid')).to.eq(ID)
    })
  })

  describe('OIDC authorize URL scope', () => {
    // The provider is served from this origin so the redirect to it can be intercepted
    const setupWithProvider = (provider) => ({
      isSetup: true,
      oidc: [
        {
          name: 'aaf',
          host: `${Cypress.config('baseUrl')}/fake-idp`,
          clientId: 'test-client',
          icon: 'https://aaf.edu.au/wp-content/uploads/AAF_LGO_small-website.png',
          displayInAdminPortal: true,
          displayInUserPortal: true,
          authorizeUrlParams: '',
          ...provider,
        },
      ],
      disableAdminPasswordLogin: true,
    })

    const authorizeScope = () => {
      // Matched by path, because a glob can't cross the slashes in the redirect_uri query
      cy.intercept(
        { pathname: '/fake-idp/authorize' },
        {
          statusCode: 200,
          headers: { 'content-type': 'text/html' },
          body: '<html><body>Provider login</body></html>',
        },
      ).as('authorize')
      cy.visit('/')
      cy.get('[data-cy="oidc-img"]').click()
      return cy
        .wait('@authorize')
        .then((interception) => new URL(interception.request.url).searchParams.get('scope'))
    }

    it('should ask for the scope that /auth/setup sends', () => {
      cy.intercept(
        '*/setup',
        setupWithProvider({ scope: 'openid email profile org.cilogon.userinfo' }),
      )
      authorizeScope().should('eq', 'openid email profile org.cilogon.userinfo')
    })

    it('should fall back to the base scopes when /auth/setup sends none', () => {
      cy.intercept('*/setup', setupWithProvider({}))
      authorizeScope().should('eq', 'openid email profile')
    })
  })
})
