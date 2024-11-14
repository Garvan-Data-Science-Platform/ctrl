import { getUserIdFromToken } from '../authentication'
import logger from 'common/src/logger'
import prisma from '../PrismaClient'
import {
  UnauthorizedErrorResponse,
  InternalErrorResponse,
  NotFoundErrorResponse,
} from 'common/types/api/errors'
import { GetParticipantProfileResponse } from 'common/types/api/users'
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
  ): Promise<GetParticipantProfileResponse> {
    /**
     * This endpoint (GET /profiles/current) is ordered above
     * the endpoint (GET /profile/{userId}) in order to avoid collisions
     */

    // Get the user ID from the token
    const token = request.headers.authorization?.split(' ')[1]

    if (!token) {
      throw new NoTokenError()
    }

    const userId: number = getUserIdFromToken(token)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await this.participantProfileRepo.findUnique({
      where: { userId },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true, middleName: true },
        },
      },
    })

    if (!data) {
      const errorMessage: string = `Participant Profile with userId: ${userId} not found`
      logger.error({ errorMessage })
      throw new NotFoundError(errorMessage)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { user, ...profile }: any = data

    const responseData: GetParticipantProfileResponse = {
      message: `Got Participant Profile with userId: ${userId}`,
      data: { ...profile, user },
    }
    logger.info({ ...responseData })
    return responseData
  }

  /**
   * Get a Participants Profile by ID
   *
   * @summary Get a Participants Profile by ID
   */
  @Get('/{userId}')
  @SuccessResponse('200', 'OK')
  @Response<NotFoundErrorResponse>('404', 'Not Found')
  public async getParticipantProfileByID(
    @Path() userId: number,
  ): Promise<GetParticipantProfileResponse> {
    const data = await this.participantProfileRepo.findUnique({
      where: { userId },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true, middleName: true },
        },
      },
    })

    if (!data) {
      const errorMessage: string = `Participant Profile with userId: ${userId} not found`
      logger.error({ errorMessage })
      throw new NotFoundError(errorMessage)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { user, ...profile }: any = data

    const responseData: GetParticipantProfileResponse = {
      message: `Got Participant Profile with userId: ${userId}`,
      data: { ...profile, user },
    }
    logger.info({ ...responseData })
    return responseData
  }
}
