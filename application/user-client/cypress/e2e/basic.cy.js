/// <reference types="cypress" />

const { UserType } = require('../../../common/cypress/support/commands')

beforeEach(() => {
  cy.task('reset')
})

describe('basic', () => {
  it('renders homepage', () => {
    cy.visit('/')
    cy.contains('Log In').should('exist')
  })
  it('can navigate to tabs', () => {
    cy.login(UserType.PARTICIPANT_UNANSWERED)
    cy.visit('/')
    cy.contains('Welcome').should('exist')
    cy.contains('My Personal').click()
    cy.contains('Update').should('exist')
    cy.contains('Contact').click()
    cy.contains('message').should('exist')
    cy.contains('News').click()
    cy.get('iframe').should('exist')
    cy.contains('Glossary').click()
    cy.contains('DNA').should('exist')
  })
  it('can navigate in mobile view', () => {
    cy.viewport('iphone-8')
    cy.login(UserType.PARTICIPANT_UNANSWERED)
    cy.visit('/')
    cy.get('[data-cy="hamburger"]').click()
    cy.get('ul li').eq(2).click({ force: true })
    cy.contains('message').should('exist')
  })

  it('can load style from backend', () => {
    cy.login(UserType.PARTICIPANT_UNANSWERED)
    cy.visit('/')
    cy.intercept('GET', '**/settings/userportal', {
      statusCode: 200,
      body: { data: { primaryColour: 'rgb(1,2,3)', secondaryColor: 'rgb(3,2,1)', newsLink: null } },
    }).as('settings')

    cy.get('[data-cy="step-button-0"]')
      .should('have.css', 'background-color')
      .and('equal', 'rgb(1, 2, 3)')
  })

  it('can load org logo from backend', () => {
    cy.login(UserType.PARTICIPANT_UNANSWERED)
    cy.visit('/')
    cy.get('[data-cy="logo"]').should('not.exist')
    cy.task('updateLogo', {
      target: 'organisation',
      filePath: '../common/testing/fixtures/valid_logo.png',
    })
    // This forces the browser to ignore previous 404s
    cy.visit('/', {
      onBeforeLoad: (win) => {
        win.caches.keys().then((names) => {
          names.forEach((name) => win.caches.delete(name))
        })
      },
    })
    cy.readFile('../common/testing/fixtures/logo_hashes.json').then((data) => {
      cy.get('[data-cy="logo"]')
        .should('be.visible')
        .and('have.attr', 'src')
        .then((src) => {
          cy.request({ url: src, encoding: 'base64' }).then((response) => {
            cy.task('calculateHash', response.body).then((hash) => {
              expect(hash).to.equal(data.validLogoResizedHash)
            })
          })
        })
    })
  })

  it('can load study logo', () => {
    cy.login(UserType.PARTICIPANT_UNANSWERED)
    cy.visit('/')
    cy.get('[data-cy="study-logo"]').should('not.exist')
    cy.task('updateLogo', {
      target: 'study',
      filePath: '../common/testing/fixtures/alternate_logo.png',
      id: 1,
    })
    // This forces the browser to ignore previous 404s
    cy.visit('/', {
      onBeforeLoad: (win) => {
        win.caches.keys().then((names) => {
          names.forEach((name) => win.caches.delete(name))
        })
      },
    })
    cy.readFile('../common/testing/fixtures/logo_hashes.json').then((data) => {
      cy.get('[data-cy="study-logo"]')
        .should('be.visible')
        .and(($img) => {
          expect($img[0].naturalWidth).to.be.greaterThan(0)
        })
        .and('have.attr', 'src')
        .then((src) => {
          cy.request({ url: src, encoding: 'base64' }).then((response) => {
            cy.task('calculateHash', response.body).then((hash) => {
              expect(hash).to.equal(data.alternateLogoResizedHash)
            })
          })
        })
    })
  })

  it('Is redirected to login when attempting to use expired token', () => {
    cy.login(UserType.PARTICIPANT_UNANSWERED)
    cy.visit('/')
    cy.contains('Welcome').should('exist')
    cy.login_expired()
    cy.visit('/')
    cy.get('[data-cy="login"]').should('exist')
  })
  it('Can log out', () => {
    cy.login(UserType.PARTICIPANT_UNANSWERED)
    cy.visit('/')
    cy.get('[data-cy="log-out"]').click()
    cy.url().should('contain', '/login')
    cy.visit('/')
    cy.url().should('contain', '/login')
  })
})
