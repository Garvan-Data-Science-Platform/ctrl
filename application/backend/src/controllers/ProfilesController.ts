import { ParticipantProfile } from '@prisma/client'
import { getUserIdFromToken } from '../authentication'
import logger from 'common/src/logger'
import prisma from '../PrismaClient'
import {
  UnauthorizedErrorResponse,
  InternalErrorResponse,
  NotFoundErrorResponse,
} from 'common/types/api/errors'
import { GetUserProfileByIDResponse } from 'common/types/api/users'
import { NotFoundError, NoTokenError } from '../middlewares/ErrorHandler'
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
} from 'tsoa'
import * as express from 'express'

@Route('profiles')
@Tags('Profiles')
@Security('jwt')
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
  public async getParticipantProfileByToken(
    @Request() request: express.Request,
  ): Promise<GetUserProfileByIDResponse> {
    /**
     * This endpoint (GET /profiles/current) is ordered above
     * the endpoint (GET /profile/{userID}) in order to avoid collisions
     */

    // Get the user ID from the token
    const token = request.headers.authorization?.split(' ')[1]

    if (!token) {
      throw new NoTokenError()
    }

    const userID: number = getUserIdFromToken(token)

    const profile: ParticipantProfile | null = await this.participantProfileRepo.findUnique({
      where: { userID },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true, middleName: true },
        },
      },
    })

    if (!profile) {
      const errorMessage: string = `Participant Profile with userID: ${userID} not found`
      logger.error({ errorMessage })
      throw new NotFoundError(errorMessage)
    }

    const responseData: GetUserProfileByIDResponse = {
      message: `Got Participant Profile with userID: ${userID}`,
      data: profile,
    }
    logger.info({ ...responseData })
    return responseData
  }

  /**
   * Get a Participants Profile by ID
   *
   * @summary Get a Participants Profile by ID
   */
  @Get('/{userID}')
  @SuccessResponse('200', 'OK')
  @Response<NotFoundErrorResponse>('404', 'Not Found')
  public async getParticipantProfileByID(
    @Path() userID: number,
  ): Promise<GetUserProfileByIDResponse> {
    const profile: ParticipantProfile | null = await this.participantProfileRepo.findUnique({
      where: { userID },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true, middleName: true },
        },
      },
    })

    if (!profile) {
      const errorMessage: string = `Participant Profile with userID: ${userID} not found`
      logger.error({ errorMessage })
      throw new NotFoundError(errorMessage)
    }

    const responseData: GetUserProfileByIDResponse = {
      message: `Got Participant Profile with userID: ${userID}`,
      data: profile,
    }
    logger.info({ ...responseData })
    return responseData
  }
}
