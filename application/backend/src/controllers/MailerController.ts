import { Response, Controller, Security, Tags, Route, Post, Body, Request } from 'tsoa'
import {
  InternalErrorResponse,
  UnauthorizedErrorResponse,
  ValidateErrorResponse,
} from 'common/types/api/errors'
import { type ContactUsRequest } from 'common/types/api/mailer'
import * as express from 'express'
import prisma from '../PrismaClient'
import { Role } from '@prisma/client'
import { NotFoundError } from '../middlewares/ErrorHandler'
import mailerTransporter, { fromAddress } from '../utils/mailer'
import nodemailer from 'nodemailer'
import logger from 'common/src/logger'

@Route('mailer')
@Tags('Mailer')
@Security('jwt')
@Response<UnauthorizedErrorResponse>('401', 'Unauthorized')
@Response<InternalErrorResponse>('500', 'Internal Server Error')
export class MailerController extends Controller {
  userRepo = prisma.user

  /**
   * Sends a contact us email to the admin and user's account.
   *
   * @summary ContactUs
   */
  @Post('/contact-us')
  @Response<ValidateErrorResponse>('422', 'Invalid Request')
  public async contactUs(
    @Body() bodyRequest: ContactUsRequest,
    @Request() request: express.Request,
  ) {
    if (!request.user) {
      throw new NotFoundError('User not found')
    }

    const userId: number = request.user.userId

    // Check if user exists
    const user = await this.userRepo.findUniqueOrThrow({
      where: { id: userId },
      select: { email: true },
    })

    // Check the mailer is available
    await mailerTransporter.verify()

    // Get the organisation admins email(s)
    const organisationAdminEmails = await prisma.user.findMany({
      where: { role: Role.OrganisationAdmin },
      select: { email: true },
    })

    // Send the email to admin(s)
    const mailListAdmins: string[] | string = process.env.CTRL_ADMIN_EMAIL
      ? [process.env.CTRL_ADMIN_EMAIL]
      : organisationAdminEmails.map((admin) => admin.email)

    const subjectToAdmin: string = `New Contact Us Request RE: ${bodyRequest.subject}`

    const mailToAdminsOptions: nodemailer.SendMailOptions = {
      from: fromAddress,
      to: mailListAdmins,
      subject: subjectToAdmin,
      text: bodyRequest.content,
    }

    await mailerTransporter.sendMail(mailToAdminsOptions)
    logger.info(`Email sent to ${mailToAdminsOptions.to}`, mailToAdminsOptions)

    // Send the email to the user
    const subjectToUser: string = `Copy of your message submitted to CTRL Administration Team RE: ${bodyRequest.subject}`

    const mailToUserOptions: nodemailer.SendMailOptions = {
      from: fromAddress,
      to: user.email,
      subject: subjectToUser,
      text: bodyRequest.content,
    }

    await mailerTransporter.sendMail(mailToUserOptions)

    logger.info(`Email sent to ${mailToUserOptions.to}`, mailToUserOptions)
    return
  }
}
