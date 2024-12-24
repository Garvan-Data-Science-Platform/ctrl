import logger from 'common/src/logger'
import prisma from '../PrismaClient'
import {
  UnauthorizedErrorResponse,
  InternalErrorResponse,
  NotFoundErrorResponse,
} from 'common/types/api/errors'
import type { GetParticipantProfileResponse, UpdateProfileRequest } from 'common/types/api/users'
import { NotFoundError } from '../middlewares/ErrorHandler'
import {
  Route,
  Tags,
  Security,
  Controller,
  Get,
  SuccessResponse,
  Path,
  Response,
  Request,
  Patch,
  Body,
} from 'tsoa'
import * as express from 'express'
import {
  AlternativeContact,
  ContactMethod,
  ParticipantType,
  StateTerritory,
} from 'common/types/api/users/ParticipantProfile'
import { DefaultResponse } from 'common/types/api'
import { FamilyMember } from 'common/types/api/users/getParticipantProfile'

@Route('profiles')
@Tags('Profiles')
@Response<UnauthorizedErrorResponse>('401', 'Unauthorized')
@Response<InternalErrorResponse>('500', 'Internal Server Error')
export class ProfilesController extends Controller {
  participantProfileRepo = prisma.participantProfile

  /**
   * Get a Participants Profile by token
   *
   * @summary Get a Participants Profile by token
   */
  @Get('/current')
  @SuccessResponse('200', 'OK')
  @Security('jwt')
  public async getParticipantProfileByToken(
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
    return this.getParticipantProfile(userId)
  }

  /**
   * Get a Participants Profile by ID
   *
   * @summary Get a Participants Profile by ID
   */
  @Get('/{userId}')
  @SuccessResponse('200', 'OK')
  @Response<NotFoundErrorResponse>('404', 'Not Found')
  @Security('jwt')
  public async getParticipantProfileByID(
    @Path() userId: number,
  ): Promise<GetParticipantProfileResponse> {
    return this.getParticipantProfile(userId)
  }

  private async getParticipantProfile(userId: number): Promise<GetParticipantProfileResponse> {
    const data = await this.participantProfileRepo.findFirst({
      where: { userId },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true, middleName: true },
        },
        nextOfKin: { select: { firstName: true, lastName: true, email: true, mobile: true } },
      },
    })

    if (!data) {
      const errorMessage: string = `Participant Profile with userId: ${userId} not found`
      logger.error({ errorMessage })
      throw new NotFoundError(errorMessage)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { user, ...profile } = data
    const { mobile, addressLine, postcode, suburb, firstName, lastName } = profile
    const dob = profile.dob.toISOString()
    const state = profile.state as StateTerritory
    const participantType = profile.participantType as ParticipantType
    const preferredContact = profile.preferredContact as ContactMethod

    const familyMembers = (await this.participantProfileRepo.findMany({
      where: { familyId: data.familyId, NOT: { userId: data.userId } },
      select: { firstName: true, lastName: true, participantType: true },
    })) as FamilyMember[]

    const responseData: GetParticipantProfileResponse = {
      message: `Got Participant Profile with userId: ${userId}`,
      data: {
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
        alternativeContact: profile.nextOfKin as AlternativeContact,
      },
    }
    logger.info({ ...responseData })
    return responseData
  }

  @Patch('/current')
  @SuccessResponse('200', 'OK')
  @Response<NotFoundErrorResponse>('404', 'Not Found')
  @Security('jwt')
  public async updateCurrentProfile(
    @Body() bodyRequest: UpdateProfileRequest,
    @Request() request: express.Request,
  ): Promise<DefaultResponse> {
    const profile = await this.participantProfileRepo.findFirstOrThrow({
      where: { userId: request.user?.userId },
    })
    const { nextOfKin, ...updateData } = { ...bodyRequest }
    if (bodyRequest.dob) updateData.dob = new Date(bodyRequest.dob) as any

    let hasNok = Boolean(nextOfKin)

    const result = await this.participantProfileRepo.update({
      where: { id: profile.id },
      data: { ...updateData, nextOfKin: hasNok ? { update: nextOfKin } : undefined },
    })

    return {}
  }
}
