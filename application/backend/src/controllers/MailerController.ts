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
import { ContactUsResponse, type ContactUsRequest } from 'common/types/api/mailer'
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
  ): Promise<ContactUsResponse> {
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

    if (!user) {
      throw new Error('User not found')
    }

    const transporter = nodemailer.createTransport({
      host: process.env.MAILER_HOST || 'smtp.gmail.com',
      port: Number(process.env.MAILER_PORT) || 465,
      auth: {
        user: process.env.MAILER_USERNAME,
        pass: process.env.MAILER_PASSWORD,
      },
    })

    try {
      // Verify Connection
      await transporter.verify()
      logger.info('Mailer service is ready to send messages...')

      // Send email to admin
      const mailToAdminOptions = {
        from: process.env.MAILER_USERNAME,
        to: process.env.CTRL_ADMIN_EMAIL,
        subject: `New Contact Us Request RE:${bodyRequest.subject}`,
        text: bodyRequest.content,
      }

      await transporter.sendMail(mailToAdminOptions)
      logger.info('Email sent to admin', mailToAdminOptions)

      // Send email to user
      const mailToUserOptions = {
        from: process.env.MAILER_USERNAME,
        to: user?.email,
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
