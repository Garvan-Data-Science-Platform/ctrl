import nodemailer from 'nodemailer'
import logger from 'common/src/logger'

export class MailerService {
  private transporter: nodemailer.Transporter

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAILER_HOST,
      port: Number(process.env.MAILER_PORT),
      auth: {
        user: process.env.MAILER_USERNAME,
        pass: process.env.MAILER_PASSWORD,
      },
    })
  }

  /**
   * Verifies the connection to the mailer service.
   */
  public async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify()
      logger.info('Mailer service is ready to send messages...')
    } catch (error) {
      logger.error('Mailer service connection error:', error)
      throw new Error('Mailer service connection failed')
    }
  }

  /**
   * Sends an email to a specific recipient.
   *
   * @param to Recipient's email address
   * @param subject Email subject
   * @param content Email body content
   */
  public async sendEmail(
    to: string | string[],
    subject: string,
    text: string,
    html?: string,
  ): Promise<void> {
    const mailOptions: nodemailer.SendMailOptions = {
      from: `CTRL <noreply@${process.env.HOSTNAME}>`,
      to,
      subject,
      text: text,
      html: html,
    }

    try {
      await this.transporter.sendMail(mailOptions)
      logger.info(`Email sent to ${to}`, mailOptions)
    } catch (error) {
      logger.error(`Error sending email to ${to}:`, error)
      throw new Error(`Failed to send email to ${to}`)
    }
  }
}
