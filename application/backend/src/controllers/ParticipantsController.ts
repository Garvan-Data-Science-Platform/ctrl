import prisma from '../PrismaClient'
import {
  UnauthorizedErrorResponse,
  InternalErrorResponse,
  NotFoundErrorResponse,
} from 'common/types/api/errors'
import { GetInvitedResponse, GetParticipantsResponse } from 'common/types/api/participants'
import { Route, Tags, Security, Controller, Get, SuccessResponse, Response } from 'tsoa'
import { Participant } from 'common/types/api/participants/participant'
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
    function determineStatus(answers: PrismaJson.SurveyAnswerData, date_published: Date) {
      if (answers.every((val) => val.status == 'completed')) return 'complete'

      const last_updated = determineLastUpdated(answers) || new Date('1900-01-01')

      if (last_updated > date_published) return 'partially_complete'

      return 'incomplete'
    }

    function determineLastUpdated(answers: PrismaJson.SurveyAnswerData) {
      let latest_date = new Date('1900-01-01')

      for (const answerStep of answers) {
        const ans_date = new Date(answerStep.last_updated || '1900-01-01')
        if (ans_date > latest_date) {
          latest_date = ans_date
        }
      }
      if (latest_date.toISOString() == new Date('1900-01-01').toISOString()) return null
      return latest_date
    }

    const unique_participants = await this.participantRepo.findMany({
      distinct: ['profileId'],
      select: {
        id: true,
        answers: true,
        profile: {
          select: { id: true, firstName: true, lastName: true, user: { select: { email: true } } },
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
 
  @Get('/{participantId}')
  @SuccessResponse('200', 'OK')
  @Response<NotFoundErrorResponse>('404', 'Not Found')
  public async getParticipantById(
    @Path() participantId: number,
  ): Promise<GetParticipantByIdResponse> {
    console.log(participantId)
    return Participant as GetParticipantByIdResponse
  }
      */
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
