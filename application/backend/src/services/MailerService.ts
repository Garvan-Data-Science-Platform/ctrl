import nodemailer from 'nodemailer'
import logger from 'common/src/logger'
import prisma from '../PrismaClient'
import { Role } from '@prisma/client'
import { ContactUsRequest } from 'common/types/api/mailer'

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
   * @param text Email body content
   */
  public async sendEmail(to: string, subject: string, text: string): Promise<void> {
    const mailOptions: nodemailer.SendMailOptions = {
      from: `CTRL <noreply@${process.env.HOSTNAME}>`,
      to,
      subject,
      text,
    }

    try {
      await this.transporter.sendMail(mailOptions)
      logger.info(`Email sent to ${to}`, mailOptions)
    } catch (error) {
      logger.error(`Error sending email to ${to}:`, error)
      throw new Error(`Failed to send email to ${to}`)
    }
  }

  public async sendContactUsEmail(bodyRequest: ContactUsRequest, userEmail: string): Promise<void> {
    const organisationAdminEmails = await prisma.user.findMany({
      where: { role: Role.OrganisationAdmin },
      select: { email: true },
    })

    const mailList: string[] = process.env.CTRL_ADMIN_EMAIL
      ? [process.env.CTRL_ADMIN_EMAIL]
      : organisationAdminEmails.map((admin) => admin.email)

    try {
      // Email to admins
      const mailToAdminOptions: nodemailer.SendMailOptions = {
        from: `CTRL <noreply@${process.env.HOSTNAME}>`,
        to: mailList,
        subject: `New Contact Us Request RE: ${bodyRequest.subject}`,
        text: bodyRequest.content,
      }
      await this.transporter.sendMail(mailToAdminOptions)
      logger.info('Email sent to admins', mailToAdminOptions)

      // Email to user
      const mailToUserOptions: nodemailer.SendMailOptions = {
        from: `CTRL <noreply@${process.env.HOSTNAME}>`,
        to: userEmail,
        subject: `Copy of your message submitted to CTRL Administration Team RE: ${bodyRequest.subject}`,
        text: bodyRequest.content,
      }
      await this.transporter.sendMail(mailToUserOptions)
      logger.info('Email sent to user', mailToUserOptions)
    } catch (error) {
      logger.error('Error sending email:', error)
      throw new Error('Failed to send email')
    }
  }
}
