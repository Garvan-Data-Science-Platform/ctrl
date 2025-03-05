import logger from 'common/src/logger'
import prisma from '../PrismaClient'
import {
  UnauthorizedErrorResponse,
  InternalErrorResponse,
  NotFoundErrorResponse,
  ValidateErrorResponse,
} from 'common/types/api/errors'
import type { GetParticipantProfileResponse, UpdateProfileRequest } from 'common/types/api/users'
import { NotFoundError } from '../middlewares/ErrorHandler'
import { Route, Tags, Security, Controller, Get, Path, Response, Request, Patch, Body } from 'tsoa'
import * as express from 'express'
import {
  AlternativeContact,
  ContactMethod,
  ParticipantType,
  StateTerritory,
} from 'common/types/api/users/ParticipantProfile'
import { FamilyMember } from 'common/types/api/users/getParticipantProfile'

@Route('profiles')
@Tags('Profiles')
@Response<UnauthorizedErrorResponse>('401', 'Unauthorized')
@Response<InternalErrorResponse>('500', 'Internal Server Error')
export class ProfilesController extends Controller {
  participantProfileRepo = prisma.participantProfile
  userRepo = prisma.user

  /**
   * Get a Participants Profile by token
   *
   * @summary Get a Participants Profile by token
   */
  @Get('/current')
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
  @Security('jwt')
  public async getParticipantProfileByUserID(
    @Path() userId: number,
  ): Promise<GetParticipantProfileResponse> {
    const p = await this.participantProfileRepo.findFirstOrThrow({ where: { userId } })
    return this.getParticipantProfile(p.id)
  }

  @Get('/{profileId}')
  @Response<NotFoundErrorResponse>('404', 'Not Found')
  @Security('jwt')
  public async getParticipantProfileByID(
    @Path() profileId: number,
  ): Promise<GetParticipantProfileResponse> {
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
    const { mobile, addressLine, postcode, suburb, firstName, lastName } = profile
    const dob = profile.dob.toISOString()
    const state = profile.state as StateTerritory
    const participantType = profile.participantType as ParticipantType
    const preferredContact = profile.preferredContact as ContactMethod

    const familyMembers = (await this.participantProfileRepo.findMany({
      where: { familyId: data.familyId, OR: [{ userId: null }, { NOT: { id: profileId } }] },
      select: { firstName: true, lastName: true, participantType: true },
    })) as FamilyMember[]

    const responseData: GetParticipantProfileResponse = {
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
        nextOfKin: profile.nextOfKin as AlternativeContact,
      },
    }
    logger.info({ ...responseData })
    return responseData
  }

  @Patch('/current')
  @Response<ValidateErrorResponse>('422', 'Validation Failed')
  @Security('jwt')
  public async updateCurrentProfile(
    @Body() bodyRequest: UpdateProfileRequest,
    @Request() request: express.Request,
  ) {
    const profile = await this.participantProfileRepo.findFirstOrThrow({
      where: { userId: request.user?.userId },
    })
    const { nextOfKin, ...updateData } = { ...bodyRequest }
    if (bodyRequest.dob) updateData.dob = new Date(bodyRequest.dob) as any

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
  @Security('jwt', ['OrganisationAdmin'])
  public async updateProfileById(
    @Path() profileId: number,
    @Body() bodyRequest: UpdateProfileRequest,
    @Request() request: express.Request,
  ) {
    const profile = await this.participantProfileRepo.findUniqueOrThrow({
      where: { id: profileId },
    })
    const { nextOfKin, email, ...updateData } = { ...bodyRequest }
    if (bodyRequest.dob) updateData.dob = new Date(bodyRequest.dob) as any

    const hasNok = Boolean(nextOfKin)

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
  }
}
