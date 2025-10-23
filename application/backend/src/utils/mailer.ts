import nodemailer from 'nodemailer'
import config from '../config'

export const fromAddress = `CTRL <noreply@${process.env.HOSTNAME}>`

export async function createMailerTransporter() {
  if (process.env.STUB_MAILER == 'true') {
    return {
      sendMail: async () => ({}),
      verify: async () => ({}),
    }
  }
  console.log('CONFIG', config)
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
