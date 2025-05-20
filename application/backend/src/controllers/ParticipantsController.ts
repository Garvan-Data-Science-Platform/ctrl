import prisma from '../PrismaClient'
import {
  UnauthorizedErrorResponse,
  InternalErrorResponse,
  NotFoundErrorResponse,
  ValidateErrorResponse,
} from 'common/types/api/errors'
import type {
  GetInvitesResponse,
  GetInviteTextResponse,
  GetParticipantResponse,
  GetParticipantsResponse,
  InviteParticipantsRequest,
  InviteParticipantsResponse,
} from 'common/types/api/participants'
import logger from 'common/src/logger'
import {
  Route,
  Tags,
  Security,
  Controller,
  Get,
  Response,
  Body,
  Path,
  Post,
  Middlewares,
} from 'tsoa'
import { Participant } from 'common/types/api/participants/participant'
import { createMailerTransporter, fromAddress } from '../utils/mailer'
import nodemailer from 'nodemailer'
import { generateInviteEmail } from 'common/src/generateInviteTemplate'
import { InviteStatus } from 'common/types/api/participants/invite'
import { BadGatewayError, NotFoundError } from '../middlewares/ErrorHandler'
import { determineLastUpdated, determineStatus } from '../utils/answers'
import { ProfilesController } from './ProfilesController'
import { auditLog } from '../middlewares/AuditLog'

@Route('participants')
@Tags('Participants')
@Security('jwt', ['OrganisationAdmin'])
@Response<UnauthorizedErrorResponse>('401', 'Unauthorized')
@Response<InternalErrorResponse>('500', 'Internal Server Error')
@Middlewares(auditLog)
export class ParticipantsController extends Controller {
  participantRepo = prisma.surveyParticipant
  profileRepo = prisma.participantProfile

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
          select: {
            id: true,
            firstName: true,
            lastName: true,
            familyId: true,
            user: { select: { email: true } },
          },
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
        familyId: p.profile.familyId,
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
   */
  @Get('/{profileId}')
  @Response<NotFoundErrorResponse>('404', 'Not Found')
  public async getParticipantById(@Path() profileId: number): Promise<GetParticipantResponse> {
    const profile = await this.profileRepo.findFirstOrThrow({
      where: { id: profileId },
      select: {
        userId: true,
        firstName: true,
        lastName: true,
        familyId: true,
        user: { select: { email: true } },
      },
    })

    const profileDataResponse = await new ProfilesController().getParticipantProfileByID(profileId)
    const profileData = profileDataResponse.data

    const p_answers = await this.participantRepo.findMany({
      where: { profileId: profileId },
      select: { answers: true, version: { select: { id: true, updatedAt: true } }, id: true },
      orderBy: { versionId: 'asc' },
    })

    return {
      data: {
        id: profileId,
        profile: profileData,
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.user?.email,
        familyId: profile.familyId,
        answers: p_answers.map((val) => ({
          surveyVersion: val.version.id,
          participantId: val.id,
          status: determineStatus(val.answers, new Date(val.version.updatedAt)),
        })),
      },
    }
  }
}

@Route('invites')
@Tags('Invites')
@Security('jwt', ['OrganisationAdmin'])
@Response<UnauthorizedErrorResponse>('401', 'Unauthorized')
@Response<InternalErrorResponse>('500', 'Internal Server Error')
export class InvitesController extends Controller {
  invitesRepo = prisma.invite

  /**
   * List all non-accepted invites
   *
   * @summary List all non-accepted invites
   */
  @Get('/')
  @Response<NotFoundErrorResponse>('404', 'Not Found')
  @Response<ValidateErrorResponse>('422', 'Validation Failed')
  public async getInvites(): Promise<GetInvitesResponse> {
    const invites = await this.invitesRepo.findMany({ where: { status: { not: 'ACCEPTED' } } })

    // Map to response
    const data = invites.map((invite) => ({
      id: invite.id,
      email: invite.email,
      createdAt: invite.createdAt.toISOString(),
      expiresAt: invite.expiresAt.toISOString(),
      sentAt: invite.sentAt ? invite.sentAt.toISOString() : undefined,
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
    const { subjectText, explanatoryText } = bodyRequest

    await prisma.study.update({
      where: { id: 1 },
      data: { inviteEmailSubject: subjectText, inviteEmailText: explanatoryText },
    })

    const emails = [...new Set(bodyRequest.emails)]
    const expiresAt = new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000) // TODO: MAKE EXPIRY CONFIGURABLE

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
      emailsResentCount: 0, // this gets assigned below
      alreadyAcceptedCount: 0, // this gets assigned below
      failedEmailsCount: 0, // this gets assigned below
      failedEmails: [], // this gets assigned below
    }

    const emailsResent: string[] = []
    const failedEmails: string[] = []

    // Resend invites for existing emails
    if (existingInvites.length > 0) {
      // If status is REVOKED, reset expiresAt and update status to PENDING
      await Promise.all(
        existingInvites.map(async (invite) => {
          if (invite.status === InviteStatus.ACCEPTED) {
            return
          }

          const emailSent = await this.sendInvite(invite.email)
          if (!emailSent) {
            logger.error(`Failed to send email to ${invite.email}`)
            await this.invitesRepo.update({
              where: { id: invite.id },
              data: {
                status: InviteStatus.FAILED_TO_SEND,
              },
            })
            failedEmails.push(invite.email)
            return
          }

          logger.info(`Resent email to existing invite ${invite.email}`)
          emailsResent.push(invite.email)

          if (
            invite.status === InviteStatus.REVOKED ||
            invite.status === InviteStatus.EXPIRED ||
            invite.status === InviteStatus.FAILED_TO_SEND
          ) {
            await this.invitesRepo.update({
              where: { id: invite.id },
              data: {
                status: InviteStatus.PENDING,
                expiresAt: expiresAt,
                sentAt: new Date(),
              },
            })
          } else if (invite.status === InviteStatus.PENDING) {
            await this.invitesRepo.update({
              where: { id: invite.id },
              data: {
                expiresAt,
                sentAt: new Date(),
              },
            })
          }
        }),
      )
    }

    // Create new invites
    if (newEmails.length > 0) {
      const emailResults = await Promise.all(
        newEmails.map(async (email) => {
          const success = await this.sendInvite(email)
          if (!success) {
            logger.error(`Failed to send email to ${email}`)
            failedEmails.push(email)
          }
          return { email, success }
        }),
      )

      const successfulEmails = emailResults
        .filter((result) => result.success)
        .map((result) => result.email)

      const newFailedEmails = emailResults
        .filter((result) => !result.success)
        .map((result) => result.email)

      // Create invites with appropriate status
      await this.invitesRepo.createMany({
        data: [
          ...successfulEmails.map((email) => ({
            email,
            expiresAt,
            sentAt: new Date(),
            status: InviteStatus.PENDING,
          })),
          ...newFailedEmails.map((email) => ({
            email,
            expiresAt,
            status: InviteStatus.FAILED_TO_SEND,
          })),
        ],
        skipDuplicates: true,
      })
    }

    Object.assign(responseData, {
      emailsResentCount: emailsResent.length,
      alreadyAcceptedCount: Math.max(
        0,
        existingInvites.length - emailsResent.length - failedEmails.length,
      ),
      failedEmailsCount: failedEmails.length,
      failedEmails,
    })

    // Log the result
    logger.info(responseData)
    return responseData
  }

  /**
   * Resend invite by ID
   *
   * @summary Resend invite
   */
  @Post('/resend/{inviteId}')
  public async resendInviteById(@Path() inviteId: number): Promise<void> {
    // Get all pending invitations
    const pendingInvite = await this.invitesRepo.findUniqueOrThrow({
      where: { id: inviteId, status: { not: InviteStatus.ACCEPTED } },
      select: { id: true, email: true },
    })

    // Send email and check if failed
    if (!(await this.sendInvite(pendingInvite.email))) {
      await this.invitesRepo.update({
        where: { id: pendingInvite.id },
        data: {
          status: InviteStatus.FAILED_TO_SEND,
        },
      })
      throw new BadGatewayError(`Failed to send email to ${pendingInvite.email}`)
    }

    logger.info(`Resent email to pending invite ${pendingInvite.email}`)

    await this.invitesRepo.update({
      where: { id: inviteId },
      data: { status: InviteStatus.PENDING, sentAt: new Date() },
    })
  }

  /**
   * Resend all pending invites
   *
   * @summary Resend invites that are currently pending
   */
  @Post('/resend')
  public async resendPendingInvites(): Promise<void> {
    // Get all pending invitations
    const pendingEmails = await this.invitesRepo.findMany({
      where: { status: InviteStatus.PENDING },
      select: { email: true },
    })

    const pendingEmailList = pendingEmails.map(({ email }) => email)

    // Send emails
    const emailResults = await Promise.all(
      pendingEmailList.map(async (email) => {
        const success = await this.sendInvite(email)
        if (!success) {
          logger.error(`Failed to send email to ${email}`)
        }
        return { email, success }
      }),
    )

    const successfulEmails = emailResults
      .filter((result) => result.success)
      .map((result) => result.email)

    const failedEmails = emailResults
      .filter((result) => !result.success)
      .map((result) => result.email)

    // Update invites with appropriate status
    await this.invitesRepo.updateMany({
      where: {
        email: { in: successfulEmails },
        status: InviteStatus.PENDING,
      },
      data: {
        status: InviteStatus.PENDING,
        sentAt: new Date(),
      },
    })

    await this.invitesRepo.updateMany({
      where: {
        email: { in: failedEmails },
        status: InviteStatus.PENDING,
      },
      data: {
        status: InviteStatus.FAILED_TO_SEND,
      },
    })

    // Log sent emails
    logger.info(`Resent ${successfulEmails.length} emails to pending invites`)
    logger.info(`Failed to send ${failedEmails.length} emails to pending invites`)
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
  /**
   * Get invite email subject and text
   *
   * @summary Get invite email subject and text
   */
  @Get('/text')
  @Response<NotFoundErrorResponse>('404', 'Not Found')
  public async getInviteText(): Promise<GetInviteTextResponse> {
    const inviteText = await prisma.study.findUniqueOrThrow({
      where: { id: 1 },
      select: { inviteEmailSubject: true, inviteEmailText: true },
    })

    return inviteText
  }

  private async sendInvite(email: string): Promise<boolean> {
    try {
      const registerLink = `${process.env.HOSTNAME}/register`
      const study = await prisma.study.findFirstOrThrow({})
      const subjectText = study?.inviteEmailSubject
      const explanatoryText = study?.inviteEmailText
      const mailerTransporter = await createMailerTransporter()

      const { html, text } = generateInviteEmail(registerLink, subjectText, explanatoryText)

      const mailOptions: nodemailer.SendMailOptions = {
        from: fromAddress,
        to: email,
        subject: subjectText,
        text,
        html,
      }

      await mailerTransporter.sendMail(mailOptions)
      return true
    } catch (error) {
      logger.error(`Failed to send email to ${email}:`, error)
      return false
    }
  }
}
