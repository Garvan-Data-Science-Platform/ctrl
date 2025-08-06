import prisma from '../PrismaClient'
import {
  UnauthorizedErrorResponse,
  InternalErrorResponse,
  NotFoundErrorResponse,
  ValidateErrorResponse,
} from 'common/types/api/errors'
import type {
  GetUserInvitesResponse,
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
  SuccessResponse,
  Body,
  Path,
  Post,
  Middlewares,
  Request,
} from 'tsoa'
import { Participant } from 'common/types/api/participants/participant'
import { createMailerTransporter, fromAddress } from '../utils/mailer'
import nodemailer from 'nodemailer'
import { generateInviteEmail } from 'common/src/generateInviteTemplate'
import { InviteStatus } from 'common/types/api/participants/invite'
import { BadGatewayError, NotFoundError } from '../middlewares/ErrorHandler'
import { createDefaultAnswers, determineLastUpdated, determineStatus } from '../utils/answers'
import { ProfilesController } from './ProfilesController'
import { auditLog } from '../middlewares/AuditLog'
import { Role } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

@Route('studies/{studyId}')
@Tags('Participants')
@Security('jwt', ['OrganisationAdmin'])
@Response<UnauthorizedErrorResponse>('401', 'Unauthorized')
@Response<InternalErrorResponse>('500', 'Internal Server Error')
@Middlewares(auditLog)
export class ParticipantsController extends Controller {
  svaRepo = prisma.surveyVersionAnswers
  profileRepo = prisma.participantProfile

  /**
   * List participants
   *
   * @summary List participants
   */
  @Get('/participants')
  public async getParticipants(@Path() studyId: number): Promise<GetParticipantsResponse> {
    const unique_participants = await this.svaRepo.findMany({
      distinct: ['profileId'],
      where: { version: { studyId } },
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
      const p_answers = await this.svaRepo.findMany({
        where: { profileId: p.profile.id, version: { studyId } },
        select: {
          answers: true,
          version: { select: { versionNumber: true, updatedAt: true } },
          id: true,
        },
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
          surveyVersionNumber: val.version.versionNumber,
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
  @Get('/participants/{profileId}')
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

    const p_answers = await this.svaRepo.findMany({
      where: { profileId: profileId },
      select: {
        answers: true,
        version: { select: { versionNumber: true, updatedAt: true } },
        id: true,
      },
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
          surveyVersionNumber: val.version.versionNumber,
          participantId: val.id,
          status: determineStatus(val.answers, new Date(val.version.updatedAt)),
        })),
      },
    }
  }
}

@Route('/')
@Tags('Invites')
@Security('jwt', ['OrganisationAdmin'])
@Response<UnauthorizedErrorResponse>('401', 'Unauthorized')
@Response<InternalErrorResponse>('500', 'Internal Server Error')
export class InvitesController extends Controller {
  invitesRepo = prisma.invite
  studyRepo = prisma.study
  profileRepo = prisma.participantProfile
  userRepo = prisma.user
  surveyRepo = prisma.surveyVersion

  /**
   * List all pending invites for a user
   *
   * @summary List all pending invites for a logged in user
   */
  @Get('/invites/pending')
  @Security('jwt', ['Participant'])
  @Response<NotFoundErrorResponse>('404', 'Not Found')
  @Response<ValidateErrorResponse>('422', 'Validation Failed')
  public async getUserInvites(@Request() request: any): Promise<GetUserInvitesResponse> {
    const user = await this.userRepo.findFirstOrThrow({
      where: {
        id: request.user.userId,
      },
    })
    if (user.role !== Role.Participant) {
      throw new NotFoundError(`Logged in user is not participant`)
    }

    const invites = await this.invitesRepo.findMany({
      where: {
        email: user.email,
        status: InviteStatus.PENDING,
      },
      include: {
        study: {
          select: {
            name: true,
            // In the future other details could be pulled through here too,
            // e.g. blurb about study
          },
        },
      },
    })

    // NOTE: I've left this code in below, but commented out.
    // I have not implemented the endpoint for users to add dependents to studies
    //  Not sure if this functionality is what study managers would want (and is complicated by ID question).

    // const userProfile = await this.profileRepo.findFirstOrThrow({
    //   where: { userId: user.id },
    //   select: { familyId: true },
    // })

    // // Get dependents info (if any) to the response so frontend can show this to choose which dependents can be included
    // const dependents = await this.profileRepo.findMany({
    //   where: {
    //     OR: [
    //       {
    //         familyId: userProfile.familyId,
    //         participantType: ParticipantType.DEPENDENT_AGE,
    //       },
    //       {
    //         familyId: userProfile.familyId,
    //         participantType: ParticipantType.DEPENDENT_OTHER,
    //       },
    //     ],
    //   },
    //   select: {
    //     firstName: true,
    //     middleName: true,
    //     lastName: true,
    //     dob: true,
    //     id: true,
    //     participantType: true,
    //   },
    // })

    // Map to response
    const formattedInvites = invites.map((invite) => ({
      id: invite.id,
      email: invite.email,
      studyId: invite.studyId,
      createdAt: invite.createdAt.toISOString(),
      expiresAt: invite.expiresAt.toISOString(),
      sentAt: invite.sentAt ? invite.sentAt.toISOString() : undefined,
      studyName: invite.study.name,
    }))

    // const formattedDependents = dependents.map((dependent) => ({
    //   firstName: dependent.firstName,
    //   middleName: dependent.middleName ? dependent.middleName : undefined,
    //   lastName: dependent.lastName,
    //   dob: dependent.dob.toISOString(),
    //   id: dependent.id,
    //   participantType: dependent.participantType as ParticipantType,
    // })) as FamilyMember[]

    return {
      data: {
        invites: formattedInvites,
        // dependents: formattedDependents,
      },
    }
  }

  /**
   * Accept an invitation
   *
   * @summary Accept an invite for an existing participant to join a new study
   */
  @Post('/invites/{inviteId}/accept')
  @Security('jwt', ['Participant'])
  @SuccessResponse('201', 'Invite Accepted')
  public async acceptInvite(@Request() request: any, @Path() inviteId: string) {
    // check inviteId exists and is not yet accepted
    const invite = await this.invitesRepo.findFirst({
      where: {
        id: inviteId,
      },
    })
    if (!invite || invite.status !== InviteStatus.PENDING) {
      throw new NotFoundError(`Pending invite not found`)
    }

    // check invite email matches user's email (via token)
    const user = await this.userRepo.findFirstOrThrow({
      where: {
        id: request.user.userId,
      },
    })
    if (!user || invite.email !== user.email) {
      throw new NotFoundError(`User does not match invite`)
    }

    // add as studyParticipant
    const existingProfile = await this.profileRepo.findFirst({
      where: {
        userId: user.id,
      },
    })
    if (!existingProfile) {
      throw new NotFoundError('Profile not found for user')
    }

    const currentSurvey = await this.surveyRepo.findFirstOrThrow({
      where: {
        status: 'PUBLISHED',
        studyId: invite.studyId,
      },
      orderBy: { id: 'desc' },
    })
    if (!currentSurvey) {
      throw new NotFoundError(`No published survey found for study ${invite.studyId}`)
    }

    await this.profileRepo.update({
      where: {
        id: existingProfile.id,
      },
      data: {
        studies: {
          create: {
            study: {
              connect: {
                id: invite.studyId,
              },
            },
          },
        },
      },
    })

    await prisma.surveyVersionAnswers.create({
      data: {
        profileId: existingProfile.id,
        versionId: currentSurvey.id,
        answers: createDefaultAnswers(currentSurvey.data),
      },
    })

    // accept invite
    const res = await this.invitesRepo.update({
      where: { id: inviteId },
      data: { status: 'ACCEPTED' },
    })
    if (!res) {
      throw new NotFoundError(`Error accepting invite`)
    }
    return {
      acceptedInvite: invite.id,
    }
  }

  /**
   * List all non-accepted invites
   *
   * @summary List all non-accepted invites for a study
   */
  @Get('/studies/{studyId}/invites')
  @Response<NotFoundErrorResponse>('404', 'Not Found')
  @Response<ValidateErrorResponse>('422', 'Validation Failed')
  public async getInvites(@Path() studyId: number): Promise<GetInvitesResponse> {
    const invites = await this.invitesRepo.findMany({
      where: {
        status: { not: 'ACCEPTED' },
        studyId: studyId,
      },
    })

    // Map to response
    const data = invites.map((invite) => ({
      id: invite.id,
      email: invite.email,
      studyId: invite.studyId,
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
   * @summary Creates invites for a list of participant emails and sends it to them
   *
   */
  @Post('/studies/{studyId}/invites')
  @Response<ValidateErrorResponse>('422', 'Validation Failed')
  public async createInvites(
    @Path() studyId: number,
    @Body() bodyRequest: InviteParticipantsRequest,
  ): Promise<InviteParticipantsResponse> {
    const { subjectText, explanatoryText } = bodyRequest

    // Check if a published survey exists
    const currentSurvey = await this.surveyRepo.findFirst({
      where: {
        status: 'PUBLISHED',
        studyId: studyId,
      },
      orderBy: { id: 'desc' },
    })

    if (!currentSurvey) {
      throw new NotFoundError(
        `No published survey found for study ${studyId}. A published survey is required before invites can be sent.`,
      )
    }

    await this.studyRepo.update({
      where: { id: studyId },
      data: { inviteEmailSubject: subjectText, inviteEmailText: explanatoryText },
    })

    const emails = [...new Set(bodyRequest.emails)]
    const expiresAt = new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000) // TODO: MAKE EXPIRY CONFIGURABLE

    // Fetch existing invites
    let existingInvites = await this.invitesRepo.findMany({
      where: {
        studyId: studyId,
      },
    })

    //Has to be done by backend server due to encryption
    existingInvites = existingInvites.filter((invite) => emails.includes(invite.email))

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

          const emailSent = await this.sendInvite(invite.email, studyId, invite.id)
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
      const inviteResults = await Promise.all(
        newEmails.map(async (email) => {
          const inviteId: string = uuidv4()
          const success = await this.sendInvite(email, studyId, inviteId)
          if (!success) {
            logger.error(`Failed to send email to ${email}`)
            failedEmails.push(email)
          }
          return { email, id: inviteId, success }
        }),
      )

      const successfulInvites = inviteResults
        .filter((invite) => invite.success)
        .map((invite) => ({ emailString: invite.email, id: invite.id }))

      const newFailedInvites = inviteResults
        .filter((invite) => !invite.success)
        .map((invite) => ({ emailString: invite.email, id: invite.id }))

      // Create invites with appropriate status
      await this.invitesRepo.createMany({
        data: [
          ...successfulInvites.map((invite) => ({
            id: invite.id,
            email: invite.emailString,
            studyId,
            expiresAt,
            sentAt: new Date(),
            status: InviteStatus.PENDING,
          })),
          ...newFailedInvites.map((invite) => ({
            id: invite.id,
            email: invite.emailString,
            studyId,
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
   * Resend invite by ID and StudyID
   *
   * @summary Resend invite by ID and StudyID
   */
  @Post('/studies/{studyId}/invites/{inviteId}/resend')
  public async resendInviteById(
    @Path() studyId: number,
    @Path() inviteId: string, // String because this is uuid
  ): Promise<void> {
    // Get all pending invitations
    const pendingInvite = await this.invitesRepo.findUniqueOrThrow({
      where: {
        id: inviteId,
        studyId: studyId,
        status: { not: InviteStatus.ACCEPTED },
      },
      select: { id: true, email: true },
    })

    // Send email and check if failed
    if (!(await this.sendInvite(pendingInvite.email, studyId, pendingInvite.id))) {
      await this.invitesRepo.update({
        where: {
          id: pendingInvite.id,
          studyId: studyId,
        },
        data: {
          status: InviteStatus.FAILED_TO_SEND,
        },
      })
      throw new BadGatewayError(`Failed to send email to ${pendingInvite.email}`)
    }

    logger.info(`Resent email to pending invite ${pendingInvite.email}`)

    await this.invitesRepo.update({
      where: {
        id: inviteId,
        studyId: studyId,
      },
      data: { status: InviteStatus.PENDING, sentAt: new Date() },
    })
  }

  /**
   * Resend all pending invites for a study
   *
   * @summary Resend invites that are currently pending for a study
   */
  @Post('/studies/{studyId}/invites/resend')
  public async resendPendingInvites(@Path() studyId: number): Promise<void> {
    // Get all pending invitations
    const pendingInvites = await this.invitesRepo.findMany({
      where: {
        status: InviteStatus.PENDING,
        studyId: studyId,
      },
      select: { email: true, id: true },
    })

    // Send emails
    const emailResults = await Promise.all(
      pendingInvites.map(async (invite) => {
        const success = await this.sendInvite(invite.email, studyId, invite.id)
        if (!success) {
          logger.error(`Failed to send email to ${invite.email} for ${studyId}`)
        }
        return { email: invite.email, success }
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
        studyId: studyId,
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
        studyId: studyId,
        email: { in: failedEmails },
        status: InviteStatus.PENDING,
      },
      data: {
        status: InviteStatus.FAILED_TO_SEND,
      },
    })

    // Log sent emails
    logger.info(
      `Resent ${successfulEmails.length} emails to pending invites for studyId: ${studyId}`,
    )
    logger.info(
      `Failed to send ${failedEmails.length} emails to pending invites for studyId: ${studyId}`,
    )
  }

  /**
   * Revoke invite
   *
   * @summary Revoke an invite by inviteId and studyId
   */
  @Post('/studies/{studyId}/invites/{inviteId}/revoke')
  @Response<NotFoundErrorResponse>('404', 'Not Found')
  public async revokeInvite(@Path() studyId: number, @Path() inviteId: string): Promise<void> {
    const invite = await this.invitesRepo.findFirst({
      where: {
        id: inviteId,
        studyId: studyId,
      },
    })

    if (!invite) {
      throw new NotFoundError('Invite not found')
    }

    await this.invitesRepo.update({
      where: {
        id: invite.id,
        studyId: studyId,
      },
      data: { status: InviteStatus.REVOKED },
    })
  }

  /**
   * Get invite email subject and text
   *
   * @summary Get invite email subject and text
   */
  //TODO: make invite register link include inviteId uuid string
  @Get('/studies/{studyId}/invites/text')
  @Response<NotFoundErrorResponse>('404', 'Not Found')
  public async getInviteText(@Path() studyId: number): Promise<GetInviteTextResponse> {
    const inviteText = await this.studyRepo.findUniqueOrThrow({
      where: { id: studyId },
      select: { inviteEmailSubject: true, inviteEmailText: true },
    })

    return inviteText
  }

  //TODO: make registerLink include inviteId uuid string
  private async sendInvite(email: string, studyId: number, inviteId: string): Promise<boolean> {
    try {
      const registerLink = `${process.env.HOSTNAME}/register/${inviteId}`
      const study = await this.studyRepo.findFirstOrThrow({
        where: {
          id: studyId,
        },
      })
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
