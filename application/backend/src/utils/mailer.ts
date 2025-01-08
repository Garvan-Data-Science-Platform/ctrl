import nodemailer from 'nodemailer'

const MailerTransporter: nodemailer.Transporter = nodemailer.createTransport(
  {
    host: process.env.MAILER_HOST,
    port: Number(process.env.MAILER_PORT),
    auth: {
      user: process.env.MAILER_USERNAME,
      pass: process.env.MAILER_PASSWORD,
    },
  },
  { from: `CTRL <noreply@${process.env.HOSTNAME}>` },
)

export default MailerTransporter
