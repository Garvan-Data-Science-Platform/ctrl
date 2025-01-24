import nodemailer from 'nodemailer'

export const fromAddress = `CTRL <noreply@${process.env.HOSTNAME}>`

const mailerTransporter: nodemailer.Transporter = nodemailer.createTransport({
  pool: true,
  host: process.env.MAILER_HOST,
  port: Number(process.env.MAILER_PORT),
  auth: {
    user: process.env.MAILER_USERNAME,
    pass: process.env.MAILER_PASSWORD,
  },
})

export default mailerTransporter
