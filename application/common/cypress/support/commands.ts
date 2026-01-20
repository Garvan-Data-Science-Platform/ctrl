/// <reference types="cypress" />

// LEAVING THESE HERE TEMPORARILY WHILE MIGRATING TO CONTSANTS FILE
// TODO: REMOVE THIS AND POINT ALL FILES TO USE CONSTANTS FILE
export enum UserType {
  PARTICIPANT_COMPLETED = 'test3@example.com',
  PARTICIPANT_UNANSWERED = 'test2@example.com',
  ORG_ADMIN = 'admin@example.com',
  STUDY_ADMIN = 'studyadmin@example.com',
}

// Shared Cypress commands

// Import from the SHARED testing folder
import { TestUsers, AppUrls, MIME_TYPES } from '../../testing/constants'

Cypress.Commands.add('uploadCommonFile', (selector, fileName) => {
  cy.task('readCommonFile', fileName).then((base64) => {
    if (!base64) throw new Error(`File "${fileName}" not found in common fixtures.`)

    const extension = fileName.split('.').pop()?.toLowerCase() || ''
    const mimeType = MIME_TYPES[extension] || 'application/octet-stream'
    // Note: this gets the first element matched
    //   for Settings page there is only one logo upload component
    //   but studies page can have multiple.
    //   If this is problematic, one option is to pass in an id and use string interpolation in the data-cy tag
    cy.get(selector)
      .first()
      .selectFile(
        {
          contents: Cypress.Buffer.from(base64 as string, 'base64'),
          fileName: fileName,
          mimeType: mimeType,
        },
        { force: true },
      )
  })
})

/**
 * Login to admin-client via browser UI
 */
Cypress.Commands.add('loginAdminUI', () => {
  cy.visit(AppUrls.ADMIN_CLIENT)
  cy.get('input[name="email"]').type(TestUsers.ADMIN.email)
  cy.get('input[name="password"]').type(TestUsers.ADMIN.password)
  cy.get('button[type="submit"]').click()
  cy.url().should('include', '/surveys') // Wait for redirect after successful login
})

/**
 * Login to user-client via browser UI
 */
Cypress.Commands.add('loginParticipantUI', (userType = 'PARTICIPANT_UNANSWERED') => {
  const user = TestUsers[userType]
  cy.visit(AppUrls.USER_CLIENT + '/login')
  cy.get('[data-cy="email"]').type(user.email)
  cy.get('[data-cy="password"]').type(user.password)
  cy.get('[data-cy="login"]').click()
  cy.contains('Welcome').should('exist') // Wait for dashboard
})

/**
 * Send invite via admin-client UI
 * @param {string} email - Email to invite
 */
Cypress.Commands.add('sendInviteUI', (email) => {
  cy.visit(AppUrls.ADMIN_CLIENT + '/participants')
  cy.get('[data-cy="invite-button"]').click()
  cy.get('[data-cy="email-field"]').type(email).type('{enter}')
  cy.get('[data-cy="send-button"]').click()
  cy.get('[data-cy="pending-list"]', { timeout: 10000 }).should('contain.text', email)
})

/**
 * Fill the participant registration form
 * @param {Object} data - Registration data (uses defaults if not provided)
 */
Cypress.Commands.add('fillRegistrationForm', (data = {}) => {
  const defaults = {
    firstName: 'Test',
    lastName: 'User',
    email: data.email || 'newuser@example.com',
    password: 'SecurePassword123!',
    dob: '1990-01-01',
    addressLine: '123 Test Street',
    suburb: 'Testville',
    state: 'VIC',
    postcode: '3000',
    mobile: '0412345678',
    contactMethod: 'EMAIL',
    nokFirst: 'Emergency',
    nokLast: 'Contact',
    nokEmail: 'emergency@example.com',
  }
  const formData = { ...defaults, ...data }

  cy.wait(500) // Wait for form to be fully loaded
  cy.get('[data-cy="reg-first"]').type(formData.firstName)
  cy.get('[data-cy="reg-last"]').type(formData.lastName)
  cy.get('[data-cy="reg-email"]').type(formData.email)
  cy.get('[data-cy="reg-password"]').type(formData.password)
  cy.get('[data-cy="reg-confirm-password"]').type(formData.password)
  cy.get('[data-cy="reg-dob"]').type(formData.dob)
  cy.get('[data-cy="reg-address-line"]').type(formData.addressLine)
  cy.get('[data-cy="reg-suburb"]').type(formData.suburb)
  cy.get('[data-cy="reg-state"]').click()
  cy.contains(formData.state).click()
  cy.get('[data-cy="reg-postcode"]').type(formData.postcode)
  cy.get('[data-cy="reg-mobile"]').type(formData.mobile)
  cy.get('[data-cy="reg-contact-method"]').click()
  cy.contains(formData.contactMethod).click()
  cy.get('[data-cy="nok-first"]').type(formData.nokFirst)
  cy.get('[data-cy="nok-surname"]').type(formData.nokLast)
  cy.get('[data-cy="nok-email"]').type(formData.nokEmail)
  cy.get('[data-cy="terms"] input').click()
})
