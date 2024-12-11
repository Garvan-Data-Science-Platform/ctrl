import { Response, Controller, Security, Tags, Route, Post, Body, Request } from 'tsoa'
import {
  InternalErrorResponse,
  UnauthorizedErrorResponse,
  ValidateErrorResponse,
} from 'common/types/api/errors'
import { ContactUsResponse, type ContactUsRequest } from 'common/types/api/mailer'
import * as express from 'express'
import prisma from '../PrismaClient'
import { NotFoundError } from '../middlewares/ErrorHandler'
import { MailerService } from '../services/MailerService'

@Route('mailer')
@Tags('Mailer')
@Security('jwt')
@Response<UnauthorizedErrorResponse>('401', 'Unauthorized')
@Response<InternalErrorResponse>('500', 'Internal Server Error')
export class MailerController extends Controller {
  userRepo = prisma.user
  mailerService = new MailerService()

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

    await this.mailerService.verifyConnection()
    await this.mailerService.sendContactUsEmail(bodyRequest, user.email)

    return {
      message: 'Contact us request successfully sent to admin team.',
    } as ContactUsResponse
  }
}
