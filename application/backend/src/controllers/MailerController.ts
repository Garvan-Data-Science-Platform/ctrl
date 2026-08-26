import { Response, Controller, Tags, Route, Post, Body, Request, Middlewares, Security } from 'tsoa'
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
import { sendEmail } from '../mailer'
import logger from 'common/src/logger'
import { auditLog } from '../middlewares/AuditLog'
import {
  generateContactUsConfirmationEmail,
  generateContactUsEmail,
} from 'common/src/emails/generate'

@Route('mailer')
@Tags('Mailer')
@Response<UnauthorizedErrorResponse>('401', 'Unauthorized')
@Response<InternalErrorResponse>('500', 'Internal Server Error')
@Middlewares(auditLog)
export class MailerController extends Controller {
  userRepo = prisma.user

  /**
   * Sends a contact us email to the admin and user's account.
   *
   * @summary ContactUs
   */
  @Post('/contact-us')
  @Security('jwt', ['Participant'])
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
      select: { email: true, firstName: true, lastName: true },
    })

    // Get the organisation admins email(s)
    const orgAdminEmails = (
      await prisma.user.findMany({
        where: { role: Role.OrganisationAdmin },
        select: { email: true },
      })
    ).map((v) => v.email)

    const studyAdminEmails = (
      await prisma.user.findMany({
        where: { role: Role.StudyAdmin, adminOfStudies: { some: { id: bodyRequest.studyId } } },
        select: { email: true },
      })
    ).map((v) => v.email)

    const study = await prisma.study.findUniqueOrThrow({ where: { id: bodyRequest.studyId } })

    const recipientEmails = study.contactUsEmail
      ? [study.contactUsEmail]
      : [...orgAdminEmails, ...studyAdminEmails]

    const subjectToAdmin: string = `New Contact Us Request From CTRL Participant: ${user.firstName} ${user.lastName}`

    const { text: adminText, html: adminHtml } = generateContactUsEmail(
      study.name,
      user.firstName,
      user.lastName,
      user.email,
      bodyRequest.content,
    )

    const { text: participantText, html: participantHtml } = generateContactUsConfirmationEmail(
      study.name,
      user.firstName,
      bodyRequest.content,
    )

    await sendEmail({
      to: recipientEmails,
      replyTo: user.email,
      subject: subjectToAdmin,
      text: adminText,
      html: adminHtml,
    })
    logger.info('Contact-us email sent to admins', {
      to: recipientEmails,
      subject: subjectToAdmin,
    })

    // Send the email to the user
    const subjectToUser: string = `CTRL Message Confirmation`

    await sendEmail({
      to: user.email,
      subject: subjectToUser,
      text: participantText,
      html: participantHtml,
    })
    logger.info('Contact-us confirmation email sent to participant', {
      to: user.email,
      subject: subjectToUser,
    })
    return
  }
}
