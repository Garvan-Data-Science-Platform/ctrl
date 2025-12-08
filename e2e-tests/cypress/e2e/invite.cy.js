beforeEach(() => {
  cy.task('reset')
})

describe('Invites', () => {
  it('Admin invites participant, participant registers via invite link', () => {
    // 1. Admin logs in on admin-client
    // 2. Admin sends invite to participant's email
    // 3. Retrieve invite link from email
    // 4. Participant visits invite link
    // 5. Participant fills registration form and submits
    // 6. Assert participant is logged in
  })

  it('Participant cannot register with expired invite link', () => {
    // 1. Admin sends invite
    // 2. Simulate invite link expiry
    // 3. Retrieve expired invite link
    // 4. Participant visits expired link
    // 5. Assert error message is shown and registration is blocked
  })

  it('Admin invite the same email twice should resend invite email', () => {
    // 1. Admin sends invite to an email
    // 2. Admin attempts to invite the same email again
    // 3. Assert that a new invite email is sent
  })

  it('Participant cannot register with invalid invite token', () => {
    // 1. Participant visits registration page with invalid token in URL
    // 2. Assert error message is shown and registration is blocked
  })

  it('Participant cannot register if already registered', () => {
    // 1. Admin sends invite to an already registered email
    // 2. Participant visits invite link
    // 3. Participant attempts to register
    // 4. Assert error message is shown and registration is blocked
  })

  it('Admin revokes invite before participant registers', () => {
    // 1. Admin sends invite
    // 2. Admin revokes invite before participant uses it
    // 3. Participant visits revoked invite link
    // 4. Assert error message is shown and registration is blocked
  })

  it('Participant sees validation errors for incomplete registration', () => {
    // 1. Admin sends invite
    // 2. Participant visits invite link
    // 3. Participant submits incomplete or invalid registration form
    // 4. Assert validation errors are shown and registration is not completed
  })
})
