/// <reference types="cypress" />

const { TestUsers, TestStudies } = require('../../../common/testing/constants.ts')

beforeEach(() => {
  cy.task('reset')
})

describe('multistudy', () => {
  it('Can change study and see correct steps', () => {
    cy.login(TestUsers.PARTICIPANT_UNANSWERED.email)
    cy.visit('/')
    cy.contains('Intro').should('exist')
    cy.get('[data-cy="change-study"]').click()
    cy.contains(TestStudies.FE_TEST_STUDY.name).click()
    cy.contains('Frontend study step').should('exist')
  })

  it('Saves active study between reloads', () => {
    cy.login(TestUsers.PARTICIPANT_UNANSWERED.email)
    cy.visit('/')
    cy.contains('Intro').should('exist')
    cy.get('[data-cy="change-study"]').click()
    cy.contains(TestStudies.FE_TEST_STUDY.name).click()
    cy.visit('/')
    cy.contains('Frontend study step').should('exist')
  })

  it('Can choose study by url param', () => {
    cy.login(TestUsers.PARTICIPANT_UNANSWERED.email)
    cy.visit(`/?studyId=${TestStudies.FE_TEST_STUDY.id}`)
    cy.contains('Frontend study step').should('exist')
  })
  it('Can save answers after changing study', () => {
    cy.login(TestUsers.PARTICIPANT_UNANSWERED.email)
    cy.visit('/')
    cy.contains('Intro').should('exist')
    cy.get('[data-cy="change-study"]').click()
    cy.contains(TestStudies.FE_TEST_STUDY.name).click()
    cy.get('[data-cy="step-button-0"]').click()
    cy.get('input[type="checkbox"]').click()
    cy.contains('Save').click()
    cy.contains('Reviewed').should('exist')
    cy.contains(TestStudies.FE_TEST_STUDY.name).should('exist')
  })

  it('Can accept an invite to a new study', () => {
    cy.login(TestUsers.PARTICIPANT_UNANSWERED.email)
    cy.task('createInvite', {
      email: TestUsers.PARTICIPANT_UNANSWERED.email,
      studyId: TestStudies.TEST_STUDY_2.id,
      prefill: {},
    })
    cy.visit('/')
    cy.get('[data-cy="step-card-0"]').should('exist')
    cy.get('[data-cy="accept-invite"]').should('exist').click()
    cy.contains('Accepted').should('exist')
    cy.contains('Close').click()
    cy.contains('Accepted').should('not.exist')
    //Changes to the right study
    cy.contains(TestStudies.TEST_STUDY_2.name).should('exist')
    cy.contains('Study2step').should('exist')
  })

  it('Can no longer access study if removed from it', () => {
    cy.login(TestUsers.PARTICIPANT_UNANSWERED.email)
    cy.task('createInvite', {
      email: TestUsers.PARTICIPANT_UNANSWERED.email,
      studyId: TestStudies.TEST_STUDY_2.id,
      prefill: {},
    })
    cy.visit('/')
    cy.get('[data-cy="step-card-0"]').should('exist')
    cy.get('[data-cy="accept-invite"]').should('exist').click()
    cy.contains('Accepted').should('exist')
    cy.contains('Close').click()
    cy.contains('Accepted').should('not.exist')
    cy.contains(TestStudies.TEST_STUDY_2.name).should('exist')
    cy.task('removeUserFromStudy', {
      email: TestUsers.PARTICIPANT_UNANSWERED.email,
      studyId: TestStudies.TEST_STUDY_2.id,
    })
    cy.visit('/')
    cy.get('[data-cy="change-study"]').click()
    cy.contains(TestStudies.TEST_STUDY_2.name).should('not.exist')
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
    cy.contains(TestStudies.FE_TEST_STUDY.name).click()
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
    cy.contains(TestStudies.TEST_STUDY.name).click()
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

  it('should load study infomation from dashboard but not expose token', () => {
    cy.intercept('GET', '**/studies/list').as('getParticipantStudies')
    cy.login(TestUsers.PARTICIPANT_UNANSWERED.email)
    cy.visit('/')

    cy.wait('@getParticipantStudies').then((interception) => {
      const firstStudy = interception.response.body.data[0]

      expect(firstStudy).to.not.have.property('redcapToken')
      expect(firstStudy).to.not.have.property('redcapURL')
    })
  })
})
