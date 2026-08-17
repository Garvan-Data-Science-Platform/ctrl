import nodemailer from 'nodemailer'
import config from '../config'

if (!process.env.HOSTNAME) {
  throw new Error('process.env.HOSTNAME is required but was not provided.')
}

const hostnameEnvVar = process.env.HOSTNAME
let mailDomain: string

if (/^https?:\/\//i.test(hostnameEnvVar)) {
  try {
    mailDomain = new URL(hostnameEnvVar).hostname
  } catch (err: any) {
    throw new Error(`HOSTNAME deployment variable not configured. ${err}`)
  }
} else {
  mailDomain = hostnameEnvVar
}

export const fromAddress = `CTRL <noreply@${mailDomain}>`

export async function createMailerTransporter() {
  if (process.env.STUB_MAILER == 'true') {
    return {
      sendMail: async () => ({}),
      verify: async () => ({}),
    }
  }
  if (!config.smtp || !Object.values(config.smtp).every((val) => !!val)) {
    throw new Error('SMTP settings not configured')
  }
  // Check the mailer is available
  return nodemailer.createTransport({
    pool: true,
    host: config.smtp.host,
    port: config.smtp.port,
    auth: {
      user: config.smtp.username,
      pass: config.smtp.password,
    },
  } as nodemailer.TransportOptions)
}
