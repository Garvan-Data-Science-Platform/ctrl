/// <reference types="cypress" />

// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
export enum UserType {
  PARTICIPANT_COMPLETED = 'test3@example.com',
  PARTICIPANT_UNANSWERED = 'test2@example.com',
}
Cypress.Commands.add('login', (type: UserType) => {
  cy.request({
    method: 'POST',
    url: `localhost:5001/auth/login`,
    body: { email: type, password: 'Testpassword1' },
  }).then((res) => {
    window.localStorage.setItem('access_token', res.body.token)
  })
})

Cypress.Commands.add('login_expired', () => {
  window.localStorage.setItem(
    'access_token',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjk3LCJzY29wZXMiOlsiT3JnYW5pc2F0aW9uQWRtaW4iXSwiaWF0IjoxNzM3MzQ3OTAyLCJleHAiOjE3MzczNTE1MDJ9.RmKfHb3SX-RRyue7tJ46Nkg-KcQOceDIiWCNSqlV4wc',
  )
})
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       login(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
//     }
//   }
// }
