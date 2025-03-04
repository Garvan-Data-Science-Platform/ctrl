import prisma from '../PrismaClient'
import {
  UnauthorizedErrorResponse,
  InternalErrorResponse,
  NotFoundErrorResponse,
  ValidateErrorResponse,
} from 'common/types/api/errors'
import type {
  GetInvitesResponse,
  GetParticipantsResponse,
  InviteParticipantsRequest,
  InviteParticipantsResponse,
} from 'common/types/api/participants'
import logger from 'common/src/logger'
import { Route, Tags, Security, Controller, Get, Response, Body, Path, Post } from 'tsoa'
import { Participant } from 'common/types/api/participants/participant'
import mailerTransporter, { fromAddress } from '../utils/mailer'
import nodemailer from 'nodemailer'
import { generateInviteEmail } from '../utils/generateInviteTemplate'
import { InviteStatus } from '../../../common/types/api/participants/invite'
import { NotFoundError } from '../middlewares/ErrorHandler'
import { determineLastUpdated, determineStatus } from '../utils/answers'

@Route('participants')
@Tags('Participants')
@Security('jwt')
@Response<UnauthorizedErrorResponse>('401', 'Unauthorized')
@Response<InternalErrorResponse>('500', 'Internal Server Error')
export class ParticipantsController extends Controller {
  participantRepo = prisma.surveyParticipant

  /**
   * List participants
   *
   * @summary List participants
   */
  @Get('/')
  public async getParticipants(): Promise<GetParticipantsResponse> {
    const unique_participants = await this.participantRepo.findMany({
      distinct: ['profileId'],
      select: {
        id: true,
        answers: true,
        profile: {
          select: { id: true, firstName: true, lastName: true, user: { select: { email: true } } },
        },
      },
    })

    const participants: GetParticipantsResponse['data'] = []

    for (const p of unique_participants) {
      const p_answers = await this.participantRepo.findMany({
        where: { profileId: p.profile.id },
        select: { answers: true, version: { select: { id: true, updatedAt: true } }, id: true },
        orderBy: { versionId: 'asc' },
      })
      const lastUpdated = Math.max(
        ...(p_answers.map((val) => determineLastUpdated(val.answers)) as unknown as number[]),
      )
      const p_data: Participant = {
        id: p.profile.id,
        email: p.profile.user?.email,
        firstName: p.profile.firstName,
        lastName: p.profile.lastName,
        lastUpdated: lastUpdated ? new Date(lastUpdated).toLocaleDateString() : undefined,
        answers: p_answers.map((val) => ({
          surveyVersion: val.version.id,
          participantId: val.id,
          status: determineStatus(val.answers, new Date(val.version.updatedAt)),
        })),
      }
      participants.push(p_data)
    }

    return { data: participants }
  }
  /**
   * Get participant by ID
   *
   * @summary Get a  Participant by ID
 
  @Get('/{participantId}')
  @SuccessResponse('200', 'OK')
  @Response<NotFoundErrorResponse>('404', 'Not Found')
  public async getParticipantById(
    @Path() participantId: number,
  ): Promise<GetParticipantByIdResponse> {
    console.log(participantId)
    return Participant as GetParticipantByIdResponse
  }
      */
}

@Route('invites')
@Tags('Invites')
@Security('jwt', ['OrganisationAdmin'])
@Response<UnauthorizedErrorResponse>('401', 'Unauthorized')
@Response<InternalErrorResponse>('500', 'Internal Server Error')
export class InvitesController extends Controller {
  invitesRepo = prisma.invite

  /**
   * List all invites
   *
   * @summary List all invites
   */
  @Get('/')
  @Response<NotFoundErrorResponse>('404', 'Not Found')
  @Response<ValidateErrorResponse>('422', 'Validation Failed')
  public async getInvites(): Promise<GetInvitesResponse> {
    const invites = await this.invitesRepo.findMany()

    // Map to response
    const data = invites.map((invite) => ({
      id: invite.id,
      email: invite.email,
      createdAt: invite.createdAt.toISOString(),
      expiresAt: invite.expiresAt.toISOString(),
      inviteStatus: invite.status as InviteStatus,
    }))

    return { data }
  }

  /**
   * Create invites
   *
   * @summary Creates invites for a list of participant emails sends it to them
   */
  @Post('/')
  @Response<ValidateErrorResponse>('422', 'Validation Failed')
  public async createInvites(
    @Body() bodyRequest: InviteParticipantsRequest,
  ): Promise<InviteParticipantsResponse> {
    const emails = bodyRequest.emails
    const expiresAt = new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000) // MAKE EXPIRY CONFIGURABLE

    // Fetch existing invites
    const existingInvites = await this.invitesRepo.findMany({
      where: { email: { in: emails } },
    })

    const newEmails = emails.filter(
      (email) => !existingInvites.map((invite) => invite.email).includes(email),
    )

    const responseData = {
      resendEmailRequestCount: emails.length,
      newInvitesCount: newEmails.length,
      emailsToResendCount: undefined!, // this gets assigned below
      alreadyAcceptedCount: undefined!, // this gets assigned below
    }

    // Resend invites for existing emails
    if (existingInvites.length > 0) {
      const emailsToResend: string[] = []
      // If status is REVOKED, reset expiresAt and update status to PENDING
      for (const invite of existingInvites) {
        if (invite.status === 'REVOKED' || invite.status === 'EXPIRED') {
          await this.invitesRepo.update({
            where: { id: invite.id },
            data: {
              status: 'PENDING',
              expiresAt: expiresAt,
            },
          })

          // Add to list of emails to resend
          emailsToResend.push(invite.email)
        } else if (invite.status === 'PENDING') {
          // Update expiry datetime
          await this.invitesRepo.update({
            where: { id: invite.id },
            data: {
              expiresAt: expiresAt,
            },
          })

          // Add to list of emails to resend
          emailsToResend.push(invite.email)
        } else if (invite.status === 'ACCEPTED') {
          continue
        }
      }

      Object.assign(responseData, {
        emailsToResendCount: emailsToResend.length,
        alreadyAcceptedCount: existingInvites.length - emailsToResend.length,
      })

      await this.sendInvites(emailsToResend)
    }

    // Create new invites
    if (newEmails.length > 0) {
      await this.invitesRepo.createMany({
        data: newEmails.map((email) => ({ email, expiresAt, status: 'PENDING' })),
      })

      // Send emails for new invites
      await this.sendInvites(newEmails)
    }

    logger.info({ ...responseData })
    return responseData
  }

  /**
   * Resend pending invites
   *
   * @summary Resend invites that are currently pending
   */
  @Post('/resend')
  public async resendPendingInvites(): Promise<void> {
    // Get all pending invitations
    const pendingEmails = await this.invitesRepo.findMany({
      where: { status: 'PENDING' },
      select: { email: true },
    })

    const pendingEmailList = pendingEmails.map(({ email }) => email)

    // Send emails
    await this.sendInvites(pendingEmailList)
  }

  /**
   * Revoke invite
   *
   * @summary Revoke an invite by id
   */
  @Post('/revoke/{inviteID}')
  @Response<NotFoundErrorResponse>('404', 'Not Found')
  public async revokeInvite(@Path() inviteID: number): Promise<void> {
    const invite = await this.invitesRepo.findFirst({ where: { id: inviteID } })

    if (!invite) {
      throw new NotFoundError('Invite not found')
    }

    await this.invitesRepo.update({
      where: { id: invite.id },
      data: { status: InviteStatus.REVOKED },
    })
  }

  private async sendInvites(emails: string[]): Promise<void> {
    const registerLink = `${process.env.HOSTNAME}/register`

    for (const email of emails) {
      // TODO: Make the email contents configurable
      const { html, text } = generateInviteEmail(registerLink)

      const mailOptions: nodemailer.SendMailOptions = {
        from: fromAddress,
        to: email,
        subject: 'Invitation to CTRL - dynamic consent platform',
        text,
        html,
      }
      await mailerTransporter.sendMail(mailOptions)
    }
  }
}
