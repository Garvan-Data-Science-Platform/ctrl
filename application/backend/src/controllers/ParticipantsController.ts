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
  UpdateParticipantRequest,
  GetDeletedParticipantsResponse,
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
  Delete,
  Patch,
  NoSecurity,
} from 'tsoa'
import { Participant } from 'common/types/api/participants/participant'
import { createMailerTransporter, fromAddress } from '../utils/mailer'
import nodemailer from 'nodemailer'
import { generateParticipantInviteEmail } from 'common/src/emails/generate'
import { InviteStatus } from 'common/types/api/participants/invite'
import { BadGatewayError, NotFoundError, UnprocessableError } from '../middlewares/ErrorHandler'
import {
  createDefaultAnswers,
  determineLastUpdated,
  determineStatus,
  recalculateAnswers,
} from '../utils/answers'
import { ProfilesController } from './ProfilesController'
import { auditLog } from '../middlewares/AuditLog'
import { Role } from '@prisma/client'
import { genId } from '../utils/genId'
import { generateInviteId, inviteExpiresAt } from '../utils/invite'
import { Prefill } from 'common/types/invite'
import type { RequestWithAuthentication } from '../authentication'

@Route('/')
@Tags('Participants')
@Security('jwt', ['OrganisationAdmin', 'StudyAdmin'])
@Response<UnauthorizedErrorResponse>('401', 'Unauthorized')
@Response<InternalErrorResponse>('500', 'Internal Server Error')
@Response<InternalErrorResponse>('422', 'Unprocessable Content')
@Middlewares(auditLog)
export class ParticipantsController extends Controller {
  svaRepo = prisma.surveyVersionAnswers
  profileRepo = prisma.participantProfile
  surveyRepo = prisma.surveyVersion
  participantRepo = prisma.studyParticipant

  /**
   * List participants
   *
   * @summary List participants
   */
  @Get('studies/{studyId}/participants')
  public async getParticipants(@Path() studyId: number): Promise<GetParticipantsResponse> {
    const participant_list = await prisma.studyParticipant.findMany({
      where: { studyId },
      select: {
        participantProfile: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            familyId: true,
            user: { select: { email: true } },
          },
        },
        participantId: true,
        externalId: true,
      },
    })

    const total = participant_list.length

    const participants: GetParticipantsResponse['data'] = []

    const all_answers = await this.svaRepo.findMany({
      where: {
        profileId: { in: participant_list.map((val) => val.participantProfile.id) },
        version: { studyId },
      },
      select: {
        answers: true,
        profileId: true,
        version: { select: { versionNumber: true, updatedAt: true } },
        id: true,
      },
      orderBy: { version: { versionNumber: 'asc' } },
    })

    for (const p of participant_list) {
      const p_answers = all_answers.filter((val) => val.profileId == p.participantProfile.id)

      const lastUpdated = Math.max(
        ...(p_answers.map((val) => determineLastUpdated(val.answers)) as unknown as number[]),
      )
      const profile = p.participantProfile
      const p_data: Participant = {
        id: profile.id,
        participantId: p.participantId || '',
        email: profile.user?.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        externalId: p.externalId || undefined,
        lastUpdated: lastUpdated ? new Date(lastUpdated).toISOString() : undefined,
        familyId: profile.familyId,
        answers: p_answers.map((val) => ({
          surveyVersionNumber: val.version.versionNumber,
          participantId: val.id,
          status: determineStatus(val.answers, new Date(val.version.updatedAt)),
        })),
      }
      participants.push(p_data)
    }

    return { data: participants, total }
  }

  /**
   * List deleted participants
   *
   * @summary List deleted participants
   */
  @Get('participants/deleted')
  public async getDeletedParticipants(
    @Request() request: RequestWithAuthentication,
  ): Promise<GetDeletedParticipantsResponse> {
    const participants = await this.participantRepo.findMany({
      where: { deleted: true, study: { id: { in: request.user.studies } } },
      select: {
        participantId: true,
        participantProfile: { select: { firstName: true, lastName: true, dob: true, id: true } },
        study: { select: { name: true, id: true } },
      },
    })

    return {
      data: participants.map((val) => ({
        ...val.participantProfile,
        id: val.participantId || '',
        profileId: val.participantProfile.id,
        study: val.study.name,
        studyId: val.study.id,
      })),
    }
  }

  /**
   * Restore a deleted participant by Profile ID
   *
   * @summary Restore deleted participant by ProfileId
   */
  @Patch('studies/{studyId}/participants/{profileId}/restore')
  @Response<NotFoundErrorResponse>('404', 'Not Found')
  public async restoreParticipantById(@Path() studyId: number, @Path() profileId: number) {
    const participant = await this.participantRepo.findUniqueOrThrow({
      where: {
        deleted: true,
        participantProfileId_studyId: { studyId, participantProfileId: profileId },
      },
      select: { participantProfile: { select: { participantType: true, familyId: true } } },
    })
    const ptype = participant.participantProfile.participantType
    const gcount = await this.participantRepo.count({
      where: {
        studyId,
        participantProfile: {
          familyId: participant.participantProfile.familyId,
          participantType: 'GUARDIAN',
        },
      },
    })

    if ((ptype == 'DEPENDENT_AGE' || ptype == 'DEPENDENT_OTHER') && gcount < 1) {
      throw new UnprocessableError(
        'Cannot restore a dependant if their guardian is not a participant of the study',
      )
    }

    await this.participantRepo.update({
      where: {
        deleted: true,
        participantProfileId_studyId: { studyId, participantProfileId: profileId },
      },
      data: { deleted: false },
    })
  }

  /**
   * Get participant by profile ID
   *
   * @summary Get a  Participant by profile ID
   */
  @Get('studies/{studyId}/participants/{profileId}/')
  @Response<NotFoundErrorResponse>('404', 'Not Found')
  public async getParticipantById(
    @Request() request: RequestWithAuthentication,
    @Path() studyId: number,
    @Path() profileId: number,
  ): Promise<GetParticipantResponse> {
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

    const profileDataResponse = await new ProfilesController().getParticipantProfileByID(
      profileId,
      request,
    )
    const profileData = profileDataResponse.data

    const p_answers = await this.svaRepo.findMany({
      where: { profileId: profileId, version: { studyId } },
      select: {
        answers: true,
        version: { select: { versionNumber: true, updatedAt: true } },
        id: true,
      },
      orderBy: { version: { versionNumber: 'asc' } },
    })

    const sp = await prisma.studyParticipant.findFirstOrThrow({
      where: { participantProfileId: profileId, studyId: studyId },
    })

    return {
      data: {
        id: profileId,
        participantId: sp.participantId || '',
        externalId: sp.externalId ?? undefined,
        profile: profileData,
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.user?.email,
        familyId: profile.familyId,
        answers: p_answers.map((val) => ({
          surveyVersionNumber: val.version.versionNumber,
          participantId: profileData.id,
          status: determineStatus(val.answers, new Date(val.version.updatedAt)),
        })),
      },
    }
  }

  @Patch('studies/{studyId}/participants/{profileId}')
  @Response<ValidateErrorResponse>('422', 'Validation Failed')
  @Security('jwt', ['OrganisationAdmin'])
  public async updateProfileById(
    @Request() request: RequestWithAuthentication,
    @Path() studyId: number,
    @Path() profileId: number,
    @Body() bodyRequest: UpdateParticipantRequest,
  ) {
    const { profile, ...participant } = bodyRequest
    await new ProfilesController().updateProfileById(request, profileId, profile)
    if (participant) {
      await this.participantRepo.update({
        where: { participantProfileId_studyId: { participantProfileId: profileId, studyId } },
        data: participant,
      })
    }
  }

  /**
   * Remove a participant from the study
   *
   * @summary Remove a participant from the study
   */
  @Delete('studies/{studyId}/participants/{profileId}')
  @Response<NotFoundErrorResponse>('404', 'Not Found')
  public async deleteParticipantById(
    @Path() studyId: number,
    @Path() profileId: number,
  ): Promise<void> {
    const profile = await prisma.participantProfile.findUniqueOrThrow({ where: { id: profileId } })

    const familyGuardiansCount = await prisma.studyParticipant.count({
      where: {
        studyId,
        participantProfile: { familyId: profile.familyId, participantType: 'GUARDIAN' },
      },
    })
    const familyDepsCount = await prisma.studyParticipant.count({
      where: {
        participantProfile: { familyId: profile.familyId },
        studyId,
        OR: [
          { participantProfile: { participantType: 'DEPENDENT_AGE' } },
          { participantProfile: { participantType: 'DEPENDENT_OTHER' } },
        ],
      },
    })
    if (profile.participantType == 'GUARDIAN' && familyGuardiansCount == 1 && familyDepsCount > 0) {
      throw new UnprocessableError('Cannot leave a dependent with no guardian')
    }

    await prisma.studyParticipant.delete({
      where: {
        participantProfileId_studyId: {
          participantProfileId: profileId,
          studyId: studyId,
        },
      },
    })

    await recalculateAnswers(profile.familyId, studyId)
  }

  /**
   * Add a participant to the study
   *
   * @summary Add a participant to the study, if they were formerly removed, or they don't have an account.
   * Throws error if user has an account and should be added via the study invite process
   */
  @Post('studies/{studyId}/participants/{profileId}')
  @Response<NotFoundErrorResponse>('404', 'Not Found')
  public async addParticipantById(
    @Path() studyId: number,
    @Path() profileId: number,
  ): Promise<void> {
    const currentSurvey = await this.surveyRepo.findFirst({
      where: {
        status: 'PUBLISHED',
        studyId,
      },
      orderBy: { versionNumber: 'desc' },
    })

    if (!currentSurvey) {
      throw new UnprocessableError('You need to publish a survey before adding participants')
    }

    const deletedP = await prisma.studyParticipant.findFirst({
      where: {
        participantProfileId: profileId,
        studyId: studyId,
        deleted: true,
      },
    })

    const profile = await this.profileRepo.findUniqueOrThrow({ where: { id: profileId } })

    if (
      profile.participantType == 'DEPENDENT_AGE' ||
      profile.participantType == 'DEPENDENT_OTHER'
    ) {
      const guardian = await this.participantRepo.findFirst({
        where: {
          studyId,
          participantProfile: { familyId: profile.familyId, participantType: 'GUARDIAN' },
        },
      })
      if (!guardian) {
        throw new UnprocessableError(
          "Can't add a dependent to a study if no guardian is a member of the study",
        )
      }
    }
    if (deletedP) {
      await this.participantRepo.update({
        where: {
          participantProfileId_studyId: {
            participantProfileId: deletedP.participantProfileId,
            studyId: deletedP.studyId,
          },
          deleted: true,
        },
        data: { deleted: false },
      })
    } else if (!profile.userId) {
      await this.participantRepo.create({
        data: { studyId: studyId, participantProfileId: profileId },
      })
      await prisma.surveyVersionAnswers.create({
        data: {
          profileId: profile.id,
          versionId: currentSurvey.id,
          answers: createDefaultAnswers(currentSurvey.data),
        },
      })
    } else {
      throw new UnprocessableError(
        'The participant must be invited to join the study via email (via the Participants page)',
      )
    }
    await recalculateAnswers(profile.familyId, studyId)
  }
}

@Route('/')
@Tags('Invites')
@Security('jwt', ['OrganisationAdmin', 'StudyAdmin'])
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
            description: true,
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
      description: invite.study.description || undefined,
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

    // Parse Prefill data
    const invitePrefill: Prefill = JSON.parse(invite?.prefill || '{}')

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
      orderBy: { versionNumber: 'desc' },
    })

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

    if (invitePrefill.studyParticipant) {
      await prisma.studyParticipant.update({
        where: {
          participantProfileId_studyId: {
            participantProfileId: existingProfile.id,
            studyId: invite.studyId,
          },
        },
        data: invitePrefill.studyParticipant,
      })
    }

    await genId(invite.studyId, existingProfile.id)

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
      orderBy: { versionNumber: 'desc' },
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

    const uniqueRecipientsMap = new Map()

    bodyRequest.recipients.forEach((recipient) => {
      const normalisedEmail = (recipient.email || '').trim().toLowerCase()

      if (normalisedEmail && !uniqueRecipientsMap.has(normalisedEmail)) {
        uniqueRecipientsMap.set(normalisedEmail, {
          ...recipient,
          email: normalisedEmail, // overwrite with normalised version
        })
      }
    })

    const recipients = Array.from(uniqueRecipientsMap.values())
    const emails = Array.from(uniqueRecipientsMap.keys())

    const expiresAt = inviteExpiresAt()

    // Fetch existing invites
    let existingInvites = await this.invitesRepo.findMany({
      where: {
        studyId: studyId,
      },
    })

    //Has to be done by backend server due to encryption
    existingInvites = existingInvites.filter((invite) => emails.includes(invite.email))

    const newRecipients = recipients.filter(
      (r) => !existingInvites.map((invite) => invite.email).includes(r.email),
    )

    const responseData = {
      resendEmailRequestCount: emails.length,
      newInvitesCount: newRecipients.length,
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
    if (newRecipients.length > 0) {
      const inviteResults = await Promise.all(
        newRecipients.map(async (r) => {
          const inviteId: string = generateInviteId()
          const success = await this.sendInvite(r.email, studyId, inviteId)
          if (!success) {
            logger.error(`Failed to send email to ${r.email}`)
            failedEmails.push(r.email)
          }
          return { recipient: r, id: inviteId, success }
        }),
      )

      const successfulInvites = inviteResults.filter((invite) => invite.success)

      const newFailedInvites = inviteResults.filter((invite) => !invite.success)

      // Create invites with appropriate status
      await this.invitesRepo.createMany({
        data: [
          ...successfulInvites.map((invite) => ({
            id: invite.id,
            email: invite.recipient.email,
            prefill: JSON.stringify(invite.recipient.prefill),
            studyId,
            expiresAt,
            sentAt: new Date(),
            status: InviteStatus.PENDING,
          })),
          ...newFailedInvites.map((invite) => ({
            id: invite.id,
            email: invite.recipient.email,
            prefill: JSON.stringify(invite.recipient.prefill),
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
  @Get('/studies/{studyId}/invites/text')
  @Response<NotFoundErrorResponse>('404', 'Not Found')
  public async getInviteText(@Path() studyId: number): Promise<GetInviteTextResponse> {
    const inviteText = await this.studyRepo.findUniqueOrThrow({
      where: { id: studyId },
      select: { inviteEmailSubject: true, inviteEmailText: true },
    })

    return inviteText
  }

  /**
   * Get invite prefill data by ID
   *
   * @summary Get invite prefill data by ID
   */
  @NoSecurity()
  @Get('/invites/{inviteId}/prefill')
  public async getPrefillDataById(inviteId: string) {
    const prefillData = await this.invitesRepo.findUniqueOrThrow({
      where: { id: inviteId },
      select: { prefill: true },
    })
    return JSON.parse(prefillData.prefill || '{}')
  }

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

      const { html, text } = generateParticipantInviteEmail(
        registerLink,
        subjectText,
        explanatoryText,
      )

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
