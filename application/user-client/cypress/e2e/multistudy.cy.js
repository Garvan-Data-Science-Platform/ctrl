/// <reference types="cypress" />

const { TestUsers } = require('../../../common/testing/constants.ts')
// TODO: import study name and id constants

beforeEach(() => {
  cy.task('reset')
})

describe('multistudy', () => {
  it('Can change study and see correct steps', () => {
    cy.login(TestUsers.PARTICIPANT_UNANSWERED.email)
    cy.visit('/')
    cy.contains('Intro').should('exist')
    cy.get('[data-cy="change-study"]').click()
    cy.contains('Study FE').click()
    cy.contains('Frontend study step').should('exist')
  })

  it('Saves active study between reloads', () => {
    cy.login(TestUsers.PARTICIPANT_UNANSWERED.email)
    cy.visit('/')
    cy.contains('Intro').should('exist')
    cy.get('[data-cy="change-study"]').click()
    cy.contains('Study FE').click()
    cy.visit('/')
    cy.contains('Frontend study step').should('exist')
  })

  it('Can choose study by url param', () => {
    cy.login(TestUsers.PARTICIPANT_UNANSWERED.email)
    cy.visit('/?studyId=3')
    cy.contains('Frontend study step').should('exist')
  })
  it('Can save answers after changing study', () => {
    cy.login(TestUsers.PARTICIPANT_UNANSWERED.email)
    cy.visit('/')
    cy.contains('Intro').should('exist')
    cy.get('[data-cy="change-study"]').click()
    cy.contains('Study FE').click()
    cy.get('[data-cy="step-button-0"]').click()
    cy.get('input[type="checkbox"]').click()
    cy.contains('Save').click()
    cy.contains('Reviewed').should('exist')
    cy.contains('Study FE').should('exist')
  })

  it('Can accept an invite to a new study', () => {
    cy.login(TestUsers.PARTICIPANT_UNANSWERED.email)
    cy.task('createInvite', {
      email: TestUsers.PARTICIPANT_UNANSWERED.email,
      studyId: 2,
      prefill: {},
    })
    cy.visit('/')
    cy.get('[data-cy="step-card-0"]').should('exist')
    cy.get('[data-cy="accept-invite"]').should('exist').click()
    cy.contains('Accepted').should('exist')
    cy.contains('Close').click()
    cy.contains('Accepted').should('not.exist')
    //Changes to the right study
    cy.contains('Study 2').should('exist')
    cy.contains('Study2step').should('exist')
  })

  it('Can no longer access study if removed from it', () => {
    cy.login(TestUsers.PARTICIPANT_UNANSWERED.email)
    cy.task('createInvite', {
      email: TestUsers.PARTICIPANT_UNANSWERED.email,
      studyId: 2,
      prefill: {},
    })
    cy.visit('/')
    cy.get('[data-cy="step-card-0"]').should('exist')
    cy.get('[data-cy="accept-invite"]').should('exist').click()
    cy.contains('Accepted').should('exist')
    cy.contains('Close').click()
    cy.contains('Accepted').should('not.exist')
    cy.contains('Study 2').should('exist')
    cy.task('removeUserFromStudy', { email: TestUsers.PARTICIPANT_UNANSWERED.email, studyId: 2 })
    cy.visit('/')
    cy.get('[data-cy="change-study"]').click()
    cy.contains('Study 2').should('not.exist')
  })

  it('changing studies changes study logo', () => {
    cy.login(TestUsers.PARTICIPANT_UNANSWERED.email)
    cy.visit('/')
    cy.get('[data-cy="study-logo"]').should('not.exist')
    // upload logos for two studies
    cy.task('updateLogo', {
      target: 'study',
      filePath: '../common/testing/fixtures/valid_logo.png',
      id: 1,
    })
    cy.task('updateLogo', {
      target: 'study',
      filePath: '../common/testing/fixtures/alternate_logo.png',
      id: 3,
    })
    // Move to alternate study
    cy.get('[data-cy="change-study"]').click()
    cy.contains('Study FE').click()
    // verify logo is correct
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

    // Change back to test study
    cy.get('[data-cy="change-study"]').click()
    cy.contains('Test Study').click()
    // verify logo is correct
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
              expect(hash).to.equal(data.validLogoResizedHash)
            })
          })
        })
    })
  })
})
