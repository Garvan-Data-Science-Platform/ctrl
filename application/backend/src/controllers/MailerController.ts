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
import { getUserIdFromToken } from '../authentication'
import { InternalErrorResponse, UnauthorizedErrorResponse } from 'common/types/api/errors'
import { type ContactUsRequest } from 'common/types/api/mailer'
import nodemailer from 'nodemailer'
import logger from 'common/src/logger'
import * as express from 'express'
import prisma from '../PrismaClient'
import { NoTokenError } from '../middlewares/ErrorHandler'

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
  ): Promise<void> {
    // Get user details
    const token = request.headers.authorization?.split(' ')[1]

    if (!token) {
      throw new NoTokenError()
    }

    const userId: number = getUserIdFromToken(token)

    // Check if user exists
    const user = await this.userRepo.findUnique({
      where: { id: userId },
      select: {
        email: true,
      },
    })

    let mailConfig
    if (process.env.NODE_ENV === 'production') {
      // all emails are delivered to destination
      mailConfig = {
        host: process.env.MAILER_HOST || 'smtp.gmail.com',
        port: process.env.MAILER_PORT || 465,
        auth: {
          user: process.env.MAILER_USERNAME,
          pass: process.env.MAILER_PASSWORD,
        },
      }
    } else {
      // all emails are catched by ethereal.email
      mailConfig = {
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
          user: 'ethereal.user@ethereal.email',
          pass: 'verysecret',
        },
      }
    }
    const transporter = nodemailer.createTransport(mailConfig)

    // Verify Connection
    transporter.verify(function (error, success) {
      if (error) {
        logger.error('Connection error:', error)
      } else {
        logger.info('Mailer service is ready to send messages...', success)
      }
    })

    // Send email to admin
    const mailToAdminOptions = {
      from: process.env.CTRL_ADMIN_EMAIL,
      to: process.env.CTRL_ADMIN_EMAIL,
      subject: `New Contact Us Request RE:${bodyRequest.subject}`,
      text: bodyRequest.content,
    }

    transporter.sendMail(mailToAdminOptions)
    logger.info('Email sent to admin', mailToAdminOptions)

    // Send email to user
    const mailToUserOptions = {
      from: process.env.CTRL_ADMIN_EMAIL,
      to: user?.email,
      subject: `Copy of your message submitted to CTRL Administration Team RE:${bodyRequest.subject}`,
      text: bodyRequest.content,
    }

    transporter.sendMail(mailToUserOptions)
    logger.info('Email sent to user', mailToUserOptions)
  }
}
