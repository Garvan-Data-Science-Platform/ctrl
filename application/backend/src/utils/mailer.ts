import nodemailer from 'nodemailer'
import config from '../config'

if (!process.env.HOSTNAME) {
  throw new Error('process.env.HOSTNAME is required but was not provided.')
}
// NOTE: this is likely superceeded by improved mailer as part of M365 OAuth PR
// immediately invoked function expression (IIFE)
export const fromAddress = (() => {
  const rawHostname = process.env.HOSTNAME || 'localhost'

  try {
    // add a prefix if missing so URL contructor can parse it
    const urlString = rawHostname.includes('://') ? rawHostname : `http://${rawHostname}`
    const parsedUrl = new URL(urlString)

    // .hostname strips protol and port
    return `CTRL <noreply@${parsedUrl.hostname}>`
  } catch {
    // fallbck if parsing fails completely
    return `CTRL <noreply@localhost>`
  }
})()

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
