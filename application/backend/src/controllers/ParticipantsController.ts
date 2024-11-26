import prisma from '../PrismaClient'
import {
  UnauthorizedErrorResponse,
  InternalErrorResponse,
  NotFoundErrorResponse,
} from 'common/types/api/errors'
import {
  GetInvitedResponse,
  GetParticipantByIdResponse,
  GetParticipantsResponse,
} from 'common/types/api/participants'
import { Route, Tags, Security, Controller, Get, SuccessResponse, Path, Response } from 'tsoa'
import Participants from 'common/example_responses/getParticipants.json'
import Participant from 'common/example_responses/getParticipant.json'
import Invites from 'common/example_responses/getInvites.json'

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
  @SuccessResponse('200', 'OK')
  @Response<NotFoundErrorResponse>('404', 'Not Found')
  public async getParticipants(): Promise<GetParticipantsResponse> {
    return Participants as GetParticipantsResponse
  }
  /**
   * Get participant by ID
   *
   * @summary Get a  Participant by ID
   */
  @Get('/{participantId}')
  @SuccessResponse('200', 'OK')
  @Response<NotFoundErrorResponse>('404', 'Not Found')
  public async getParticipantById(
    @Path() participantId: number,
  ): Promise<GetParticipantByIdResponse> {
    console.log(participantId)
    return Participant as GetParticipantByIdResponse
  }
}

@Route('invites')
@Tags('Invites')
@Security('jwt')
@Response<UnauthorizedErrorResponse>('401', 'Unauthorized')
@Response<InternalErrorResponse>('500', 'Internal Server Error')
export class InvitesController extends Controller {
  /**
   * List invites
   *
   * @summary List participants
   */
  @Get('/')
  @SuccessResponse('200', 'OK')
  @Response<NotFoundErrorResponse>('404', 'Not Found')
  public async getInvites(): Promise<GetInvitedResponse> {
    return Invites
  }
}
