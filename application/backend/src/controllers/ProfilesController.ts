import logger from 'common/src/logger'
import prisma from '../PrismaClient'
import {
  UnauthorizedErrorResponse,
  InternalErrorResponse,
  NotFoundErrorResponse,
  ValidateErrorResponse,
} from 'common/types/api/errors'
import type { GetParticipantProfileResponse, UpdateProfileRequest } from 'common/types/api/users'
import { NotFoundError, UnprocessableError } from '../middlewares/ErrorHandler'
import {
  Route,
  Tags,
  Security,
  Controller,
  Get,
  Path,
  Response,
  Request,
  Patch,
  Body,
  Middlewares,
} from 'tsoa'
import * as express from 'express'
import {
  AlternativeContact,
  ContactMethod,
  ParticipantType,
  StateTerritory,
} from 'common/types/api/users/ParticipantProfile'
import { FamilyMember } from 'common/types/api/users/getParticipantProfile'
import { auditLog } from '../middlewares/AuditLog'
import { recalculateAnswers } from '../utils/answers'
import type { RequestWithAuthentication } from '../authentication'

@Route('profiles')
@Tags('Profiles')
@Security('jwt', ['OrganisationAdmin', 'StudyAdmin'])
@Response<UnauthorizedErrorResponse>('401', 'Unauthorized')
@Response<InternalErrorResponse>('500', 'Internal Server Error')
@Middlewares(auditLog)
export class ProfilesController extends Controller {
  participantProfileRepo = prisma.participantProfile
  userRepo = prisma.user

  /**
   * Get the current Participants Profile
   *
   * @summary Get the current Participants Profile
   */
  @Get('/current')
  @Security('jwt', ['Participant'])
  public async getCurrentParticipantProfile(
    @Request() request: express.Request,
  ): Promise<GetParticipantProfileResponse> {
    /**
     * This endpoint (GET /profiles/current) is ordered above
     * the endpoint (GET /profile/{userId}) in order to avoid collisions
     */

    if (!request.user) {
      throw new NotFoundError('User not found')
    }

    const userId: number = request.user.userId
    const p = await this.participantProfileRepo.findFirstOrThrow({ where: { userId } })
    return this.getParticipantProfile(p.id)
  }

  /**
   * Get a Participants Profile by ID
   *
   * @summary Get a Participants Profile by ID
   */
  @Get('/user/{userId}')
  @Response<NotFoundErrorResponse>('404', 'Not Found')
  public async getParticipantProfileByUserID(
    @Request() request: RequestWithAuthentication,
    @Path() userId: number,
  ): Promise<GetParticipantProfileResponse> {
    const p = await this.participantProfileRepo.findFirstOrThrow({
      where: { userId, studies: { some: { studyId: { in: request.user.studies } } } },
    })
    return this.getParticipantProfile(p.id)
  }

  @Get('/{profileId}')
  @Response<NotFoundErrorResponse>('404', 'Not Found')
  public async getParticipantProfileByID(
    @Path() profileId: number,
    @Request() request: RequestWithAuthentication,
  ): Promise<GetParticipantProfileResponse> {
    //Check user has permission to view this profile
    await this.participantProfileRepo.findFirstOrThrow({
      where: { id: profileId, studies: { some: { studyId: { in: request.user.studies } } } },
    })
    return this.getParticipantProfile(profileId)
  }

  private async getParticipantProfile(profileId: number): Promise<GetParticipantProfileResponse> {
    const data = await this.participantProfileRepo.findUniqueOrThrow({
      where: { id: profileId },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true, middleName: true },
        },
        nextOfKin: { select: { firstName: true, lastName: true, email: true, mobile: true } },
      },
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { user, ...profile } = data
    const { mobile, addressLine, postcode, suburb, firstName, lastName, familyId, id, dob } =
      profile
    const state = profile.state as StateTerritory
    const participantType = profile.participantType as ParticipantType
    const preferredContact = profile.preferredContact as ContactMethod

    const familyMembers = (await this.participantProfileRepo.findMany({
      where: { familyId: data.familyId, NOT: { id: profileId } },
      select: { firstName: true, lastName: true, id: true, participantType: true },
    })) as FamilyMember[]

    const responseData: GetParticipantProfileResponse = {
      data: {
        id,
        firstName,
        lastName,
        addressLine,
        postcode,
        suburb,
        state,
        preferredContact,
        dob,
        email: user?.email,
        mobile,
        participantType,
        familyMembers,
        familyId,
        nextOfKin: profile.nextOfKin as AlternativeContact,
      },
    }
    logger.info({ ...responseData })
    return responseData
  }

  @Patch('/current')
  @Security('jwt', ['Participant'])
  @Response<ValidateErrorResponse>('422', 'Validation Failed')
  public async updateCurrentProfile(
    @Body() bodyRequest: UpdateProfileRequest,
    @Request() request: express.Request,
  ) {
    const profile = await this.participantProfileRepo.findFirstOrThrow({
      where: { userId: request.user?.userId },
    })
    const { nextOfKin, ...updateData } = { ...bodyRequest }

    const hasNok = Boolean(nextOfKin)

    await this.participantProfileRepo.update({
      where: { id: profile.id },
      data: { ...updateData, nextOfKin: hasNok ? { update: nextOfKin } : undefined },
    })

    await this.userRepo.update({
      where: { id: request.user?.userId },
      data: { firstName: bodyRequest.firstName, lastName: bodyRequest.lastName },
    })
  }

  @Patch('/{profileId}')
  @Response<ValidateErrorResponse>('422', 'Validation Failed')
  public async updateProfileById(
    @Request() request: RequestWithAuthentication,
    @Path() profileId: number,
    @Body() bodyRequest: UpdateProfileRequest,
  ) {
    const profile = await this.participantProfileRepo.findUniqueOrThrow({
      where: { id: profileId, studies: { some: { studyId: { in: request.user.studies } } } },
      select: {
        participantType: true,
        familyId: true,
        userId: true,
        id: true,
        studies: { select: { studyId: true } },
      },
    })
    const { nextOfKin, email, ...updateData } = { ...bodyRequest }

    const hasNok = Boolean(nextOfKin)

    if (bodyRequest.participantType != profile.participantType) {
      const affectedStudies = await prisma.study.findMany({
        where: {
          profiles: {
            some: {
              participantProfile: { familyId: profile.familyId },
            },
          },
        },
        select: { id: true },
      })

      if (!affectedStudies.every((s) => request.user.studies.includes(s.id))) {
        throw new UnprocessableError(
          'You do not have admin permissions for every study impacted by this change.',
        )
      }
    }

    for (const study of profile.studies) {
      const familyGuardiansCount = await prisma.studyParticipant.count({
        where: {
          studyId: study.studyId,
          participantProfile: { familyId: profile.familyId, participantType: 'GUARDIAN' },
        },
      })

      if (bodyRequest.participantType && profile.participantType == 'GUARDIAN') {
        const familyDepsCount = await prisma.studyParticipant.count({
          where: {
            studyId: study.studyId,
            participantProfile: {
              familyId: profile.familyId,
              OR: [{ participantType: 'DEPENDENT_AGE' }, { participantType: 'DEPENDENT_OTHER' }],
            },
          },
        })
        if (familyGuardiansCount == 1 && familyDepsCount > 0) {
          throw new UnprocessableError('Cannot leave a dependent with no guardian')
        }
      }
      if (
        (bodyRequest.participantType == 'DEPENDENT_AGE' ||
          bodyRequest.participantType == 'DEPENDENT_OTHER') &&
        familyGuardiansCount == 0
      ) {
        throw new UnprocessableError('Cannot add a dependent to a family with no guardian')
      }
    }

    await this.participantProfileRepo.update({
      where: { id: profile.id },
      data: { ...updateData, nextOfKin: hasNok ? { update: nextOfKin } : undefined },
    })

    if (profile.userId) {
      await this.userRepo.update({
        where: { id: profile.userId },
        data: { email: email, firstName: bodyRequest.firstName, lastName: bodyRequest.lastName },
      })
    }

    if (bodyRequest.participantType) {
      const studies = await prisma.study.findMany({
        where: {
          profiles: {
            some: {
              participantProfile: {
                familyId: profile.familyId,
              },
            },
          },
        },
        select: {
          id: true,
          name: true,
        },
      })

      if (studies.length === 0) return

      for (const study of studies) {
        await recalculateAnswers(profile.familyId, study.id)
      }
    }
  }
}
