import {
  generateAdminInviteEmail,
  generateAdminPasswordInviteEmail,
  generateContactUsConfirmationEmail,
  generateContactUsEmail,
  generateParticipantInviteEmail,
  generatePasswordResetEmail,
} from './generate'

describe('Email rendering tests', () => {
  it('Renders admin invite email', () => {
    const loginLink = 'https://example.com/login'
    const { html, text } = generateAdminInviteEmail(loginLink)

    expect(html).toContain('<style>') // Check if styles are inlined
    expect(html).toContain(loginLink) // Check if the login link is substituted
    expect(html).not.toContain('${') // Ensure no placeholders remain
    expect(text).toContain(loginLink) // Check if the login link is in the plain text version
  })

  it('Renders admin password based invite email', () => {
    const passwordResetLink = 'https://example.com/reset-password'
    const { html, text } = generateAdminPasswordInviteEmail(passwordResetLink)

    expect(html).toContain('<style>') // Check if styles are inlined
    expect(html).toContain(passwordResetLink) // Check if the password reset link is substituted
    expect(html).not.toContain('${') // Ensure no placeholders remain
    expect(text).toContain(passwordResetLink) // Check if the password reset link is in the plain text version
  })

  it('Renders contact us email', () => {
    const studyName = 'Study A'
    const firstName = 'John'
    const lastName = 'Doe'
    const email = 'john.doe@example.com'
    const content = 'This is a test message.'
    const { html, text } = generateContactUsEmail(studyName, firstName, lastName, email, content)

    expect(html).toContain('<style>') // Check if styles are inlined
    expect(html).toContain(studyName) // Check if the study name is substituted
    expect(html).toContain(firstName) // Check if the first name is substituted
    expect(html).toContain(lastName) // Check if the last name is substituted
    expect(html).toContain(email) // Check if the email is substituted
    expect(html).toContain(content) // Check if the content is substituted
    expect(html).not.toContain('${') // Ensure no placeholders remain
    expect(text).toContain(studyName) // Check if the study name is in the plain text version
    expect(text).toContain(firstName) // Check if the first name is in the plain text version
    expect(text).toContain(lastName) // Check if the last name is in the plain text version
    expect(text).toContain(email) // Check if the email is in the plain text version
    expect(text).toContain(content) // Check if the content is in the plain text version
  })

  it('Renders contact us confirmation email', () => {
    const studyName = 'Study A'
    const firstName = 'John'
    const content = 'This is a test message.'
    const { html, text } = generateContactUsConfirmationEmail(studyName, firstName, content)

    expect(html).toContain('<style>') // Check if styles are inlined
    expect(html).toContain(studyName) // Check if the study name is substituted
    expect(html).toContain(firstName) // Check if the first name is substituted
    expect(html).toContain(content) // Check if the content is substituted
    expect(html).not.toContain('${') // Ensure no placeholders remain
    expect(text).toContain(studyName) // Check if the study name is in the plain text version
    expect(text).toContain(firstName) // Check if the first name is in the plain text version
    expect(text).toContain(content) // Check if the content is in the plain text version
  })

  it('Renders participant invite email', () => {
    const registerLink = 'https://example.com/register'
    const title = 'Welcome to the Study'
    const explanatoryText = 'Please register to participate in the study.'
    const { html, text } = generateParticipantInviteEmail(registerLink, title, explanatoryText)

    expect(html).toContain('<style>') // Check if styles are inlined
    expect(html).toContain(registerLink) // Check if the register link is substituted
    expect(html).toContain(title) // Check if the title is substituted
    expect(html).toContain(explanatoryText) // Check if the explanatory text is substituted
    expect(html).not.toContain('${') // Ensure no placeholders remain
    expect(text).toContain(registerLink) // Check if the register link is in the plain text version
    expect(text).toContain(explanatoryText) // Check if the explanatory text is in the plain text version
  })

  it('Renders password reset email', () => {
    const resetLink = 'https://example.com/reset-password'
    const firstName = 'John'
    const { html, text } = generatePasswordResetEmail(resetLink, firstName)

    expect(html).toContain('<style>') // Check if styles are inlined
    expect(html).toContain(resetLink) // Check if the reset link is substituted
    expect(html).toContain(firstName) // Check if the first name is substituted
    expect(html).not.toContain('${') // Ensure no placeholders remain
    expect(text).toContain(resetLink) // Check if the reset link is in the plain text version
    expect(text).toContain(firstName) // Check if the first name is in the plain text version
  })
})
