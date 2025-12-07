import prisma from '../PrismaClient'
import {
  UnauthorizedErrorResponse,
  InternalErrorResponse,
  NotFoundErrorResponse,
  ValidateErrorResponse,
  UnprocessableErrorResponse,
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
import { ParticipantType, PrismaClient } from '@prisma/client'
import { createDefaultAnswers } from '../utils/answers'
import { genId, genIndId } from '../utils/genId'
import { UnprocessableError } from '../middlewares/ErrorHandler'
import actionWithEvent from '../../prisma/events/actionWithEvents'
import actionWithEvents from '../../prisma/events/actionWithEvents'
import { CtrlEvent } from '../../prisma/events/event.type'

@Route('studies/{studyId}/families')
@Tags('Families')
@Response<UnauthorizedErrorResponse>('401', 'Unauthorized')
@Response<InternalErrorResponse>('500', 'Internal Server Error')
@Response<UnprocessableErrorResponse>('422', 'Unprocessable Content')
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
    const inStudy = (await prisma.participantProfile.findMany({
      where: {
        familyId,
        studies: {
          some: {
            studyId: studyId,
            deleted: false,
          },
        },
      },
      select: { firstName: true, lastName: true, id: true, participantType: true },
      orderBy: { id: 'asc' },
    })) as FamilyMember[]

    const notInStudy = (await prisma.participantProfile.findMany({
      where: {
        familyId,
        studies: {
          none: {
            studyId: studyId,
            deleted: false,
          },
        },
      },
      select: { firstName: true, lastName: true, id: true, participantType: true },
      orderBy: { id: 'asc' },
    })) as FamilyMember[]

    return {
      data: [
        ...inStudy.map((val) => ({ ...val, inStudy: true })),
        ...notInStudy.map((val) => ({ ...val, inStudy: false })),
      ],
    }
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

    if (['DEPENDENT_AGE', 'DEPENDENT_OTHER'].includes(profile.participantType)) {
      throw new UnprocessableError('Cannot remove a dependant')
    }

    if (profile.participantType == 'GUARDIAN') {
      const familyGuardiansCount = await prisma.participantProfile.count({
        where: {
          familyId: profile.familyId,
          participantType: 'GUARDIAN',
        },
      })

      const familyDepsCount = await prisma.participantProfile.count({
        where: {
          familyId: profile.familyId,
          OR: [{ participantType: 'DEPENDENT_AGE' }, { participantType: 'DEPENDENT_OTHER' }],
        },
      })

      if (familyGuardiansCount == 1 && familyDepsCount > 0) {
        throw new UnprocessableError('Cannot leave a dependent with no guardian')
      }
    }

    const lastFam = await prisma.participantProfile.findFirstOrThrow({
      orderBy: { familyId: 'desc' },
      select: { familyId: true },
    })

    const oldId = profile.familyId

    const newId = lastFam.familyId + 1 //TODO: this is succeptable to race conditions right?

    const prevMembers = (
      await prisma.participantProfile.findMany({ where: { familyId: oldId }, select: { id: true } })
    ).map((v) => v.id)

    await actionWithEvents(
      'participantProfile',
      'update',
      {
        where: {
          id: profileId,
          studies: {
            some: {
              studyId: studyId,
            },
          },
        },
        data: { familyId: newId },
      },
      [
        {
          eventType: 'family.updated',
          payload: {
            familyId: oldId,
            payloadVersion: 1,
            previousMemberProfileIds: prevMembers,
            newMemberProfileIds: prevMembers.filter((val) => val != profileId),
          },
        },
        {
          eventType: 'family.created',
          payload: {
            familyId: newId,
            payloadVersion: 1,
            newMemberProfileIds: [profileId],
          },
        },
      ],
    )

    //Needed to reset the autoincrement
    await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('"ParticipantProfile"', 'familyId'), coalesce(max("familyId")+1, 1), false) FROM "ParticipantProfile";`

    return
  }

  /**
   * addExistingMember
   *
   * @summary Add an existing CTRL profile as a member of a family.
   * Note: this endpoint assumes that initial family composition is valid. When adding non-guardians to a family there are no checks that the new family state will be valid.
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
      select: { participantType: true, familyId: true, studies: { select: { studyId: true } } },
    })

    if (profile.participantType == 'GUARDIAN') {
      for (const study of profile.studies) {
        const oldFamGuardianCount = await prisma.participantProfile.count({
          where: {
            familyId: profile.familyId,
            participantType: 'GUARDIAN',
            studies: { some: { studyId: study.studyId, deleted: false } },
          },
        })
        const oldFamDepCount = await prisma.participantProfile.count({
          where: {
            familyId: profile.familyId,
            OR: [{ participantType: 'DEPENDENT_AGE' }, { participantType: 'DEPENDENT_OTHER' }],
            studies: { some: { studyId: study.studyId, deleted: false } },
          },
        })

        if (oldFamDepCount > 0 && oldFamGuardianCount == 1) {
          throw new UnprocessableError(
            'Cannot add this person because they are currently in a family where they are the only guardian in a study. Move dependents out of their family first.',
          )
        }
      }
    }

    if (
      profile.participantType == 'DEPENDENT_AGE' ||
      profile.participantType == 'DEPENDENT_OTHER'
    ) {
      for (const study of profile.studies) {
        const newFamGuardianCount = await prisma.participantProfile.count({
          where: {
            familyId,
            participantType: 'GUARDIAN',
            studies: { some: { studyId: study.studyId, deleted: false } },
          },
        })
        if (newFamGuardianCount == 0) {
          throw new UnprocessableError(
            'Cannot add this person because they are a dependent and there must be at least one guardian in this family first. The guardian must be a participant in every study the dependent is.',
          )
        }
      }
    }

    const oldId = profile.familyId

    const prevMembersOldFamily = (
      await prisma.participantProfile.findMany({ where: { familyId: oldId }, select: { id: true } })
    ).map((v) => v.id)

    const prevMembersNewFamily = (
      await prisma.participantProfile.findMany({ where: { familyId }, select: { id: true } })
    ).map((v) => v.id)

    await actionWithEvents(
      'participantProfile',
      'update',
      {
        where: {
          id: profileId,
          studies: {
            some: {
              studyId: studyId,
            },
          },
        },
        data: { familyId },
      },
      [
        {
          eventType: 'family.updated',
          payload: {
            familyId: oldId,
            payloadVersion: 1,
            previousMemberProfileIds: prevMembersOldFamily,
            newMemberProfileIds: prevMembersOldFamily.filter((val) => val != profileId),
          },
        },
        {
          eventType: 'family.updated',
          payload: {
            familyId: familyId,
            payloadVersion: 1,
            previousMemberProfileIds: prevMembersNewFamily,
            newMemberProfileIds: [profileId, ...prevMembersNewFamily],
          },
        },
      ],
    )

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
        dob: bodyRequest.dob,
      },
    })

    if (depCheck) {
      throw new UnprocessableError('Dependent already registered in CTRL')
    }

    const familyProfilesCount = await prisma.studyParticipant.count({
      where: { studyId, participantProfile: { familyId, participantType: 'GUARDIAN' } },
    })
    if (familyProfilesCount == 0) {
      throw new UnprocessableError(
        'At least one family member must have the role of Guardian and be participating in the study to add a dependent',
      )
    }

    const currentSurvey = await prisma.surveyVersion.findFirstOrThrow({
      where: {
        status: 'PUBLISHED',
        studyId: studyId,
      },
      orderBy: { versionNumber: 'desc' },
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
      throw new UnprocessableError('This family has no existing members in this study')
    }

    const participantType = bodyRequest.permanent
      ? ParticipantType.DEPENDENT_OTHER
      : ParticipantType.DEPENDENT_AGE

    await prisma.$transaction(async (tx) => {
      const depProfile = await tx.participantProfile.create({
        data: {
          ...existingProfile,
          individualId: undefined,
          userId: null, // Null userId for dependents
          firstName: bodyRequest.firstName,
          lastName: bodyRequest.lastName,
          dob: bodyRequest.dob,
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

      await genIndId(depProfile.id, tx as PrismaClient)
      await genId(studyId, depProfile.id, tx as PrismaClient)

      await tx.surveyVersionAnswers.create({
        data: {
          profileId: depProfile.id,
          versionId: currentSurvey.id,
          answers: createDefaultAnswers(currentSurvey.data),
        },
      })

      const prevMembers = (
        await tx.participantProfile.findMany({
          where: { familyId },
          select: { id: true },
        })
      ).map((v) => v.id)

      await tx.outbox.create({
        data: {
          eventType: 'family.updated',
          payload: JSON.stringify({
            familyId,
            newMemberProfileIds: [depProfile.id, ...prevMembers],
            previousMemberProfileIds: prevMembers,
            payloadVersion: 1,
          } as CtrlEvent['payload']),
        },
      })
    })

    return
  }
}
