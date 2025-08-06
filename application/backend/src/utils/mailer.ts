import nodemailer from 'nodemailer'
import prisma from '../PrismaClient'

export const fromAddress = `CTRL <noreply@${process.env.HOSTNAME}>`

export async function createMailerTransporter() {
  if (process.env.STUB_MAILER == 'true') {
    return {
      sendMail: async () => ({}),
      verify: async () => ({}),
    }
  }
  const mailSettings = await prisma.organisation.findFirstOrThrow({
    where: { id: 1 },
    select: { mailerHost: true, mailerPassword: true, mailerPort: true, mailerUser: true },
  })

  if (!Object.values(mailSettings).every((val) => !!val)) {
    throw new Error('SMTP settings not configured')
  }
  // Check the mailer is available
  return nodemailer.createTransport({
    pool: true,
    host: mailSettings.mailerHost,
    port: mailSettings.mailerPort,
    auth: {
      user: mailSettings.mailerUser,
      pass: mailSettings.mailerPassword,
    },
  } as nodemailer.TransportOptions)
}
