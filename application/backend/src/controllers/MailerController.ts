import {
  SuccessResponse,
  Response,
  Controller,
  Security,
  Tags,
  Route,
  Post,
  Body,
  Request,
} from 'tsoa'
import { InternalErrorResponse, UnauthorizedErrorResponse } from 'common/types/api/errors'
import { ContactUsResponse, type ContactUsRequest } from 'common/types/api/mailer'
import nodemailer from 'nodemailer'
import logger from 'common/src/logger'
import * as express from 'express'
import prisma from '../PrismaClient'
import { NotFoundError } from '../middlewares/ErrorHandler'
import { Role } from '@prisma/client'

@Route('mailer')
@Tags('Mailer')
@Security('jwt')
@Response<UnauthorizedErrorResponse>('401', 'Unauthorized')
@Response<InternalErrorResponse>('500', 'Internal Server Error')
export class MailerController extends Controller {
  userRepo = prisma.user

  /**
   * Sends a contact us email to the admin and users account.
   *
   * @summary ContactUs
   */
  @Post('/contact-us')
  @SuccessResponse('200', 'Email sent')
  public async contactUs(
    @Body() bodyRequest: ContactUsRequest,
    @Request() request: express.Request,
  ): Promise<ContactUsResponse> {
    if (!request.user) {
      throw new NotFoundError('User not found')
    }

    const userId: number = request.user.userId

    // Check if user exists
    const user = await this.userRepo.findUniqueOrThrow({
      where: { id: userId },
      select: {
        email: true,
      },
    })

    const transporter = nodemailer.createTransport({
      host: process.env.MAILER_HOST,
      port: Number(process.env.MAILER_PORT),
      auth: {
        user: process.env.MAILER_USERNAME,
        pass: process.env.MAILER_PASSWORD,
      },
    })

    try {
      // Verify Connection
      await transporter.verify()
      logger.info('Mailer service is ready to send messages...')

      const organisationAdminEmails = await this.userRepo.findMany({
        where: {
          role: Role.OrganisationAdmin,
        },
        select: {
          email: true,
        },
      })

      // Use CTRL_ADMIN_EMAIL if set, otherwise use all organisation admins' emails.
      let maillist: string[]
      if (!process.env.CTRL_ADMIN_EMAIL) {
        maillist = organisationAdminEmails.map((orgAdmin) => orgAdmin.email)
      } else {
        maillist = [process.env.CTRL_ADMIN_EMAIL]
      }

      // Send email to all organisation admins
      const mailToAdminOptions: nodemailer.SendMailOptions = {
        from: `CTRL <noreply@${process.env.HOSTNAME}>`,
        to: maillist,
        subject: `New Contact Us Request RE:${bodyRequest.subject}`,
        text: bodyRequest.content,
      }

      await transporter.sendMail(mailToAdminOptions)
      logger.info('Email sent to admin', mailToAdminOptions)

      // Send email to user
      const mailToUserOptions: nodemailer.SendMailOptions = {
        from: `CTRL <noreply@${process.env.HOSTNAME}>`,
        to: user.email,
        subject: `Copy of your message submitted to CTRL Administration Team RE: ${bodyRequest.subject}`,
        text: bodyRequest.content,
      }

      await transporter.sendMail(mailToUserOptions)
      logger.info('Email sent to user', mailToUserOptions)
    } catch (error) {
      logger.error('Error sending email:', error)
      throw new Error('Failed to send email')
    } finally {
      transporter.close()
    }

    return {
      message: 'Contact us request successfully sent to admin team.',
    } as ContactUsResponse
  }
}
