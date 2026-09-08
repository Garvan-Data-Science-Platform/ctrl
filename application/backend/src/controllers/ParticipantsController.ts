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
import { sendEmail } from '../mailer'
import { generateParticipantInviteEmail } from 'common/src/emails/generate'
import { InviteStatus } from 'common/types/api/participants/invite'
import { NotFoundError, UnprocessableError } from '../middlewares/ErrorHandler'
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
import { generateInviteId, inviteExpiresAt, ACTIVE_INVITE_STATUSES } from '../utils/invite'
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
        status: { in: ACTIVE_INVITE_STATUSES },
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

    if (!invite || !ACTIVE_INVITE_STATUSES.includes(invite.status)) {
      // QUEUED counts as still-open — the drain has not yet flipped it to PENDING but
      // the row is real, so a recipient who lands here mid-drain must be able to accept.
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
   * @summary Queue invites for a list of participant emails and return 202. The mails
   * are drained asynchronously; poll GET /studies/{studyId}/invites for per-row status.
   */
  @Post('/studies/{studyId}/invites')
  @SuccessResponse('202', 'Invites queued')
  @Response<ValidateErrorResponse>('422', 'Validation Failed')
  public async createInvites(
    @Path() studyId: number,
    @Body() bodyRequest: InviteParticipantsRequest,
  ): Promise<InviteParticipantsResponse> {
    const { subjectText, explanatoryText } = bodyRequest

    const currentSurvey = await this.surveyRepo.findFirst({
      where: { status: 'PUBLISHED', studyId },
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

    // Dedup by email; reject when the same address has conflicting prefill (a REDCap
    // export with a participant in two arms). Matching-prefill duplicates collapse silently.
    const uniqueRecipients = new Map<string, (typeof bodyRequest.recipients)[number]>()
    for (const r of bodyRequest.recipients) {
      const prev = uniqueRecipients.get(r.email)
      if (prev && JSON.stringify(prev.prefill) !== JSON.stringify(r.prefill)) {
        throw new UnprocessableError(
          'Duplicate participant emails with conflicting prefill data. Please deduplicate the source before submitting.',
        )
      }
      uniqueRecipients.set(r.email, r)
    }
    const recipients = Array.from(uniqueRecipients.values())
    const emails = recipients.map((r) => r.email)
    const expiresAt = inviteExpiresAt()

    // Invite.email is `/// @encrypted`, so filter existing rows in memory rather than
    // via an `in` query (which compares plaintext against ciphertext and matches none).
    const allExisting = await this.invitesRepo.findMany({ where: { studyId } })
    const existingInvites = allExisting.filter((invite) => emails.includes(invite.email))

    const existingByEmail = new Map(existingInvites.map((i) => [i.email, i]))
    const alreadyAcceptedCount = existingInvites.filter(
      (i) => i.status === InviteStatus.ACCEPTED,
    ).length

    const resendTargets = existingInvites.filter((i) => i.status !== InviteStatus.ACCEPTED)
    const newRecipients = recipients.filter((r) => !existingByEmail.has(r.email))

    // Write-first: row must exist before the mail so /register/{id} works mid-drain.
    // Status guard on the write catches a race where the row becomes ACCEPTED between
    // fetch and update — prevents flipping ACCEPTED back to QUEUED.
    if (resendTargets.length > 0) {
      await this.invitesRepo.updateMany({
        where: {
          id: { in: resendTargets.map((i) => i.id) },
          status: { not: InviteStatus.ACCEPTED },
        },
        // sentAt preserved: it's "last known good delivery", not "last attempt outcome".
        data: { status: InviteStatus.QUEUED, expiresAt },
      })
    }

    const newRecipientPayload = newRecipients.map((r) => ({
      id: generateInviteId(),
      email: r.email,
      prefill: JSON.stringify(r.prefill),
      studyId,
      expiresAt,
      status: InviteStatus.QUEUED,
    }))

    if (newRecipientPayload.length > 0) {
      await this.invitesRepo.createMany({
        data: newRecipientPayload,
        skipDuplicates: true,
      })
    }

    // Re-query so a concurrent createInvites that won the [studyId, emailHash] race
    // doesn't leave us mailing a link whose row was never persisted.
    const attemptedNewIds = newRecipientPayload.map((p) => p.id)
    const persistedNew = attemptedNewIds.length
      ? await this.invitesRepo.findMany({
          where: { studyId, id: { in: attemptedNewIds } },
          select: { id: true },
        })
      : []
    const persistedNewIds = persistedNew.map((r) => r.id)
    const toDrainIds = [...resendTargets.map((i) => i.id), ...persistedNewIds]

    // fire-and-forget; .catch prevents Node's unhandled-rejection crash
    void this.drainInvites(toDrainIds, studyId).catch((err) => {
      logger.error({ message: 'drainInvites crashed', studyId, err })
    })

    this.setStatus(202)

    const responseData: InviteParticipantsResponse = {
      resendEmailRequestCount: emails.length,
      newInvitesCount: persistedNewIds.length,
      queuedForResendCount: resendTargets.length,
      queuedCount: toDrainIds.length,
      alreadyAcceptedCount,
    }

    logger.info({ message: 'Invite request queued', studyId, ...responseData })
    return responseData
  }

  /**
   * Resend invite by ID and StudyID
   *
   * @summary Re-queue an invite by ID and StudyID and return 202. The mail drains
   * asynchronously; poll GET /studies/{studyId}/invites for status.
   */
  @Post('/studies/{studyId}/invites/{inviteId}/resend')
  @SuccessResponse('202', 'Invite queued')
  public async resendInviteById(
    @Path() studyId: number,
    @Path() inviteId: string, // String because this is uuid
  ): Promise<void> {
    // Excludes ACCEPTED only; Resend on REVOKED is treated as un-revoke (matches bulk).
    // No idempotency on QUEUED — accepts rare double-mail to keep Resend as the pod-
    // restart recovery path.
    const invite = await this.invitesRepo.findUniqueOrThrow({
      where: {
        id: inviteId,
        studyId,
        status: { not: InviteStatus.ACCEPTED },
      },
      select: { id: true },
    })

    // updateMany + status guard: silent no-op if the row raced to ACCEPTED between
    // findUniqueOrThrow and this write.
    await this.invitesRepo.updateMany({
      where: {
        id: invite.id,
        studyId,
        status: { not: InviteStatus.ACCEPTED },
      },
      // sentAt preserved on requeue — see the comment on createInvites' resend update.
      data: {
        status: InviteStatus.QUEUED,
        expiresAt: inviteExpiresAt(),
      },
    })

    void this.drainInvites([invite.id], studyId).catch((err) => {
      logger.error({ message: 'drainInvites crashed', studyId, inviteId: invite.id, err })
    })

    this.setStatus(202)
  }

  /**
   * Resend all pending invites for a study
   *
   * @summary Re-queue all PENDING invites for a study and return 202. The mails drain
   * asynchronously; poll GET /studies/{studyId}/invites for per-row status.
   */
  @Post('/studies/{studyId}/invites/resend')
  @SuccessResponse('202', 'Invites queued')
  public async resendPendingInvites(@Path() studyId: number): Promise<void> {
    // Includes QUEUED so pod-restart-stranded rows are recoverable here too.
    const pendingInvites = await this.invitesRepo.findMany({
      where: { status: { in: ACTIVE_INVITE_STATUSES }, studyId },
      select: { id: true },
    })

    if (pendingInvites.length === 0) {
      this.setStatus(202)
      return
    }

    const inviteIds = pendingInvites.map((i) => i.id)

    // Guard prevents a race with acceptInvite / revokeInvite from being clobbered.
    await this.invitesRepo.updateMany({
      where: {
        studyId,
        id: { in: inviteIds },
        status: { in: ACTIVE_INVITE_STATUSES },
      },
      data: {
        status: InviteStatus.QUEUED,
        expiresAt: inviteExpiresAt(),
      },
    })

    void this.drainInvites(inviteIds, studyId).catch((err) => {
      logger.error({ message: 'drainInvites crashed', studyId, err })
    })

    logger.info({ message: 'Pending invites re-queued', studyId, count: inviteIds.length })
    this.setStatus(202)
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

  private async sendInviteMail(
    email: string,
    inviteId: string,
    study: { inviteEmailSubject: string; inviteEmailText: string },
  ): Promise<void> {
    const registerLink = `${process.env.HOSTNAME}/register/${inviteId}`
    const { html, text } = generateParticipantInviteEmail(
      registerLink,
      study.inviteEmailSubject,
      study.inviteEmailText,
    )

    await sendEmail({
      to: email,
      subject: study.inviteEmailSubject,
      text,
      html,
    })
  }

  private async drainInvites(inviteIds: string[], studyId: number): Promise<void> {
    if (inviteIds.length === 0) return

    const study = await this.studyRepo.findFirstOrThrow({
      where: { id: studyId },
      select: { inviteEmailSubject: true, inviteEmailText: true },
    })
    const stillQueued = await this.invitesRepo.findMany({
      where: { studyId, id: { in: inviteIds }, status: InviteStatus.QUEUED },
      select: { id: true, email: true },
    })

    await Promise.all(
      stillQueued.map(async ({ id, email }) => {
        try {
          await this.sendInviteMail(email, id, study)
          await this.invitesRepo.updateMany({
            where: { id, status: InviteStatus.QUEUED },
            data: { status: InviteStatus.PENDING, sentAt: new Date() },
          })
        } catch (err) {
          await this.invitesRepo.updateMany({
            where: { id, status: InviteStatus.QUEUED },
            data: { status: InviteStatus.FAILED_TO_SEND },
          })
          logger.error({
            message: 'Failed to send participant invite',
            studyId,
            inviteId: id,
            err,
          })
        }
      }),
    )
  }
}
