import { readFileSync } from 'node:fs'
import { join } from 'node:path'

let styles: string
let participantInviteTemplate: string
let passwordResetTemplate: string
let contactUsTemplate: string
let contactUsConfirmationTemplate: string
let adminPasswordInviteTemplate: string
let adminInviteTemplate: string

// Use `readFileSync` in development and esbuild raw imports in production
if (!process.env.ESBUILD) {
  const basePath = __dirname
  styles = readFileSync(join(basePath, 'styles.css'), 'utf8')
  participantInviteTemplate = readFileSync(join(basePath, 'participantInvite.html'), 'utf8')
  passwordResetTemplate = readFileSync(join(basePath, 'passwordReset.html'), 'utf8')
  contactUsTemplate = readFileSync(join(basePath, 'contactUs.html'), 'utf8')
  contactUsConfirmationTemplate = readFileSync(join(basePath, 'contactUsConfirmation.html'), 'utf8')
  adminPasswordInviteTemplate = readFileSync(join(basePath, 'adminPasswordInvite.html'), 'utf8')
  adminInviteTemplate = readFileSync(join(basePath, 'adminInvite.html'), 'utf8')
} else {
  styles = require('./styles.css?raw')
  participantInviteTemplate = require('./participantInvite.html?raw')
  passwordResetTemplate = require('./passwordReset.html?raw')
  contactUsTemplate = require('./contactUs.html?raw')
  contactUsConfirmationTemplate = require('./contactUsConfirmation.html?raw')
  adminPasswordInviteTemplate = require('./adminPasswordInvite.html?raw')
  adminInviteTemplate = require('./adminInvite.html?raw')
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function generateParticipantInviteEmail(
  registerLink: string,
  title: string,
  explanatoryText: string,
): { html: string; text: string } {
  let html = participantInviteTemplate

  html = html
    .replaceAll('${title}', escapeHtml(title))
    .replaceAll('${registerLink}', escapeHtml(registerLink))
    .replaceAll('${explanatoryText}', escapeHtml(explanatoryText))
    .replace('<link rel="stylesheet" href="./styles.css" />', `<style>${styles}</style>`)
  const text = `Hello,\n\n ${explanatoryText}\n\nUse the following URL to register with CTRL:\n${registerLink}\n\nIf you have any issues, please contact our support team.`
  return { html, text }
}

export function generatePasswordResetEmail(
  resetLink: string,
  firstName: string,
): { html: string; text: string } {
  let html = passwordResetTemplate
  html = html
    .replaceAll('${resetLink}', escapeHtml(resetLink))
    .replaceAll('${firstName}', escapeHtml(firstName))
    .replace('<link rel="stylesheet" href="./styles.css" />', `<style>${styles}</style>`)

  const text = `Hello ${firstName},\n\nWe received a request to reset your password. If you did not make this request, you can safely ignore this email.\n\nUse the following URL to reset your password:\n${resetLink}\n\nIf you have any issues, please contact our support team.`
  return { html, text }
}

export function generateContactUsEmail(
  studyName: string,
  firstName: string,
  lastName: string,
  email: string,
  content: string,
): { html: string; text: string } {
  let html = contactUsTemplate
  html = html
    .replaceAll('${studyName}', escapeHtml(studyName))
    .replaceAll('${firstName}', escapeHtml(firstName))
    .replaceAll('${lastName}', escapeHtml(lastName))
    .replaceAll('${email}', escapeHtml(email))
    .replaceAll('${content}', escapeHtml(content))
    .replace('<link rel="stylesheet" href="./styles.css" />', `<style>${styles}</style>`)

  const text = `You have received a new message via the CTRL 'Contact Us' form.
    Study: ${studyName}
    Participant: ${firstName} ${lastName} (${email})
    Message: ${content}
    `
  return { html, text }
}

export function generateContactUsConfirmationEmail(
  studyName: string,
  firstName: string,
  content: string,
): { html: string; text: string } {
  let html = contactUsConfirmationTemplate
  html = html
    .replaceAll('${studyName}', escapeHtml(studyName))
    .replaceAll('${firstName}', escapeHtml(firstName))
    .replaceAll('${content}', escapeHtml(content))
    .replace('<link rel="stylesheet" href="./styles.css" />', `<style>${styles}</style>`)

  const text = `Hi ${firstName}, \n\n This email is to confirm that CTRL ${studyName} admins have received your contact us message. A copy of the message is provided below: \n ${content}`
  return { html, text }
}

export function generateAdminPasswordInviteEmail(passwordResetLink: string): {
  html: string
  text: string
} {
  let html = adminPasswordInviteTemplate
  html = html
    .replaceAll('${passwordResetLink}', passwordResetLink)
    .replace('<link rel="stylesheet" href="./styles.css" />', `<style>${styles}</style>`)
  const text = `Hello,\n\n You have been invited to become a CTRL admin user.\n\nUse the following URL to set your password:\n${passwordResetLink}\n\nIf you have any issues, please contact our support team.`
  return { html, text }
}

export function generateAdminInviteEmail(loginLink: string): {
  html: string
  text: string
} {
  let html = adminInviteTemplate
  html = html
    .replaceAll('${loginLink}', loginLink)
    .replace('<link rel="stylesheet" href="./styles.css" />', `<style>${styles}</style>`)
  const text = `Hello,\n\n You have been invited to become a CTRL admin user.\n\nUse the following URL to log in:\n${loginLink}\n\nIf you have any issues, please contact our support team.`
  return { html, text }
}
