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
  Post,
} from 'tsoa'
import * as express from 'express'
import { GetFamilyResponse } from 'common/types/api/families'
import { FamilyMember } from 'common/types/api/users/getParticipantProfile'
import { auditLog } from '../middlewares/AuditLog'

@Route('families')
@Tags('Families')
@Response<UnauthorizedErrorResponse>('401', 'Unauthorized')
@Response<InternalErrorResponse>('500', 'Internal Server Error')
@Middlewares(auditLog)
export class FamiliesController extends Controller {
  participantProfileRepo = prisma.participantProfile
  userRepo = prisma.user

  @Get('/{familyId}')
  @Response<NotFoundErrorResponse>('404', 'Not Found')
  @Security('jwt')
  public async getFamilyById(@Path() familyId: number): Promise<GetFamilyResponse> {
    const members = (await prisma.participantProfile.findMany({
      where: { familyId },
      select: { firstName: true, lastName: true, id: true, participantType: true },
    })) as FamilyMember[]
    return { data: members }
  }

  /**
   * removeMember
   *
   * @summary Remove a member from their family, put into a new family.
   */
  @Post('/remove/{profileId}')
  @Response<NotFoundErrorResponse>('404', 'Not Found')
  @Security('jwt')
  public async removeMember(@Path() profileId: number) {
    const lastFam = await prisma.participantProfile.findFirstOrThrow({
      orderBy: { familyId: 'desc' },
      select: { familyId: true },
    })

    const newId = lastFam.familyId + 1

    await prisma.participantProfile.update({
      where: { id: profileId },
      data: { familyId: newId },
    })

    //Needed to reset the autoincrement
    await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('"ParticipantProfile"', 'familyId'), coalesce(max("familyId")+1, 1), false) FROM "ParticipantProfile";`

    return
  }

  @Post('/{familyId}/add/{profileId}')
  @Response<NotFoundErrorResponse>('404', 'Not Found')
  @Security('jwt')
  public async addMember(@Path() familyId: number, @Path() profileId: number) {
    await prisma.participantProfile.update({
      where: { id: profileId },
      data: { familyId },
    })
    return
  }
}
