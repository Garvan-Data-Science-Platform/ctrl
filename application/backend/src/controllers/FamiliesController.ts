import prisma from '../PrismaClient'
import {
  UnauthorizedErrorResponse,
  InternalErrorResponse,
  NotFoundErrorResponse,
  ValidateErrorResponse,
} from 'common/types/api/errors'
import {
  Route,
  Tags,
  Security,
  Controller,
  Get,
  Path,
  Response,
  Body,
  Middlewares,
  Post,
} from 'tsoa'
import type { AddDependentRequest, GetFamilyResponse } from 'common/types/api/families'
import { FamilyMember } from 'common/types/api/users/getParticipantProfile'
import { auditLog } from '../middlewares/AuditLog'
import { ParticipantType } from '@prisma/client'
import { createDefaultAnswers, recalculateAnswers } from '../utils/answers'

@Route('studies/{studyId}/families')
@Tags('Families')
@Response<UnauthorizedErrorResponse>('401', 'Unauthorized')
@Response<InternalErrorResponse>('500', 'Internal Server Error')
@Security('jwt', ['OrganisationAdmin'])
@Middlewares(auditLog)
export class FamiliesController extends Controller {
  participantProfileRepo = prisma.participantProfile
  userRepo = prisma.user

  @Get('/{familyId}')
  @Response<NotFoundErrorResponse>('404', 'Not Found')
  public async getFamilyById(
    @Path() studyId: number,
    @Path() familyId: number,
  ): Promise<GetFamilyResponse> {
    const members = (await prisma.participantProfile.findMany({
      where: {
        familyId,
        studies: {
          some: {
            studyId: studyId,
          },
        },
      },
      select: { firstName: true, lastName: true, id: true, participantType: true },
      orderBy: { dob: 'asc' },
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
  public async removeMember(@Path() studyId: number, @Path() profileId: number) {
    const profile = await prisma.participantProfile.findUniqueOrThrow({
      where: {
        id: profileId,
        studies: {
          some: {
            studyId: studyId,
          },
        },
      },
    })

    const lastFam = await prisma.participantProfile.findFirstOrThrow({
      orderBy: { familyId: 'desc' },
      select: { familyId: true },
    })

    const oldId = profile.familyId

    const newId = lastFam.familyId + 1 //TODO: this is succeptable to race conditions right?

    await prisma.participantProfile.update({
      where: {
        id: profileId,
        studies: {
          some: {
            studyId: studyId,
          },
        },
      },
      data: { familyId: newId },
    })

    //Needed to reset the autoincrement
    await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('"ParticipantProfile"', 'familyId'), coalesce(max("familyId")+1, 1), false) FROM "ParticipantProfile";`

    //Recalculate answers for any dependents in the old family (if any)
    await recalculateAnswers(oldId, studyId)

    return
  }

  /**
   * addExistingMember
   *
   * @summary Add an existing CTRL profile as a member of a family.
   */
  @Post('/{familyId}/add/{profileId}')
  @Response<NotFoundErrorResponse>('404', 'Not Found')
  public async addExistingMember(
    @Path() studyId: number,
    @Path() familyId: number,
    @Path() profileId: number,
  ) {
    const profile = await prisma.participantProfile.findUniqueOrThrow({
      where: {
        id: profileId,
        studies: {
          some: {
            studyId: studyId,
          },
        },
      },
    })
    const oldId = profile.familyId

    await prisma.participantProfile.update({
      where: {
        id: profileId,
        studies: {
          some: {
            studyId: studyId,
          },
        },
      },
      data: { familyId },
    })

    //Recalculate answers for any dependents in the new or old families
    await recalculateAnswers(familyId, studyId)
    await recalculateAnswers(oldId, studyId)

    return
  }

  /**
   * addNewDependent
   *
   * @summary Add a new dependent to the family.
   */
  @Post('/{familyId}/add-dependent')
  @Response<NotFoundErrorResponse>('404', 'Not Found')
  @Response<ValidateErrorResponse>('422', 'Validation Failed')
  public async addNewDependent(
    @Path() studyId: number,
    @Path() familyId: number,
    @Body() bodyRequest: AddDependentRequest,
  ) {
    //Check dependent doesn't already exist
    const depCheck = await prisma.participantProfile.findFirst({
      where: {
        firstName: bodyRequest.firstName,
        lastName: bodyRequest.lastName,
        dob: new Date(bodyRequest.dob),
        studies: {
          some: {
            studyId: studyId,
          },
        },
      },
    })

    if (depCheck) {
      throw new Error('Dependent already registered in CTRL')
    }

    const currentSurvey = await prisma.surveyVersion.findFirstOrThrow({
      where: {
        status: 'PUBLISHED',
        studyId: studyId,
      },
      orderBy: { id: 'desc' },
    })

    const existingProfile = await prisma.participantProfile.findFirst({
      where: {
        familyId,
        studies: {
          some: {
            studyId: studyId,
          },
        },
      },
    })

    if (!existingProfile) {
      throw new Error('This family has no existing members in this study')
    }

    const participantType = bodyRequest.permanent
      ? ParticipantType.DEPENDENT_OTHER
      : ParticipantType.DEPENDENT_AGE

    const depProfile = await prisma.participantProfile.create({
      data: {
        ...existingProfile,
        userId: null, // Null userId for dependents
        firstName: bodyRequest.firstName,
        lastName: bodyRequest.lastName,
        dob: new Date(bodyRequest.dob),
        id: undefined,
        participantType,
        studies: {
          create: {
            study: {
              connect: {
                id: studyId,
              },
            },
          },
        },
      },
    })

    await prisma.surveyVersionAnswers.create({
      data: {
        profileId: depProfile.id,
        versionId: currentSurvey.id,
        answers: createDefaultAnswers(currentSurvey.data),
      },
    })

    await recalculateAnswers(familyId, studyId)

    return
  }
}
