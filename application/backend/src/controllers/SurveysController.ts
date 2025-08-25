/* eslint-disable  @typescript-eslint/no-explicit-any */

import {
  Get,
  Body,
  Request,
  Post,
  Route,
  Tags,
  Path,
  Response,
  Controller,
  Security,
  Patch,
  ValidateError,
  Middlewares,
} from 'tsoa'
import logger from 'common/src/logger'
import type {
  GetAllResponsesResponse,
  GetResponsesByIdResponse,
  GetUserSurveyStepResponse,
  GetUserSurveyStepsResponse,
  GetSurveyVersionsResponse,
  GetSurveyVersionByVersionNumberResponse,
  UpdateSurveyAnswersRequest,
  UpdateSurveyRequest,
} from 'common/types/api/surveys'
import { SurveyVersion as SurveyVersionPrisma } from '@prisma/client'
import { SurveyElementType, SurveyStep, SurveyStepStatus } from 'common/types/survey'
import prisma from '../PrismaClient'
import '../jsontypes'
import { validateAnswers } from 'common/src/surveys/validateSurveyAnswers'
import { populateSurveyStepAnswers } from 'common/src/surveys/populateSurveyStepAnswers'
import { ValidateErrorResponse } from 'common/types/api/errors'
import {
  answersFromPreviousSurvey,
  combineGuardianAnswers,
  createDefaultAnswers,
} from '../utils/answers'
import { auditLog } from '../middlewares/AuditLog'

@Route('studies/{studyId}')
@Tags('Surveys')
@Response('500', 'Internal Server Error')
@Response('401', 'Unauthorized')
@Middlewares(auditLog)
export class SurveysController extends Controller {
  surveyRepo = prisma.surveyVersion
  svaRepo = prisma.surveyVersionAnswers
  profileRepo = prisma.participantProfile
  auditLogRepo = prisma.auditLog

  /**
   * Get all Survey versions
   *
   * @summary Get all Survey versions
   */
  @Get('/surveys')
  @Security('jwt', ['OrganisationAdmin'])
  public async getAllSurveys(@Path() studyId: number): Promise<GetSurveyVersionsResponse> {
    const surveys: SurveyVersionPrisma[] = await this.surveyRepo.findMany({
      where: { studyId },
      orderBy: [{ versionNumber: 'desc' }],
    })
    if (surveys.length == 0) {
      const initial_survey = await this.surveyRepo.create({
        data: { data: [], status: 'DRAFT', studyId: studyId, versionNumber: 1 },
      })
      surveys.push(initial_survey)
    }

    const formattedSurveys = surveys.map((survey) => ({
      id: survey.id,
      versionNumber: survey.versionNumber,
      publishedAt: survey.publishedAt ? survey.publishedAt.toISOString() : undefined,
      status: survey.status,
      updatedAt: survey.updatedAt.toISOString(),
      createdAt: survey.createdAt.toISOString(),
    }))

    const responseData: GetSurveyVersionsResponse = { data: formattedSurveys }
    logger.info({ ...responseData })
    return responseData
  }

  /**
   * Gets a specific survey version for a study using their VersionNumber
   *
   * @summary Get Specific Survey
   */
  @Get('/surveys/{versionNumber}')
  @Security('jwt', ['OrganisationAdmin'])
  @Response('404', 'Not Found')
  public async getSurveyVersionByVersionNumber(
    @Path() studyId: number,
    @Path() versionNumber: number,
  ): Promise<GetSurveyVersionByVersionNumberResponse> {
    const survey: SurveyVersionPrisma | null = await this.surveyRepo.findUniqueOrThrow({
      where: {
        studyId_versionNumber: {
          versionNumber: versionNumber,
          studyId: studyId,
        },
      },
    })

    const responseData: GetSurveyVersionByVersionNumberResponse = {
      data: {
        id: survey.id,
        version_number: survey.versionNumber,
        status: survey.status,
        data: survey.data as unknown as SurveyStep[],
      },
    }
    return responseData
  }

  /**
   * Get user survey steps
   *
   * @summary Get survey steps for current user
   */
  @Get('/survey-steps')
  @Security('jwt', ['Participant'])
  @Response('404', 'Not Found')
  public async getUserSurveySteps(
    @Request() request: any,
    //eslint-disable-next-line
    @Path() studyId: number,
  ): Promise<GetUserSurveyStepsResponse> {
    const profile = await this.profileRepo.findFirstOrThrow({
      where: { userId: request.user.userId },
    })

    const surveyVersionAnswers = await this.svaRepo.findFirstOrThrow({
      where: {
        profileId: profile.id,
        version: {
          studyId: studyId,
        },
      },
      orderBy: { versionId: 'desc' },
    })

    const surveyVersionId = surveyVersionAnswers.versionId

    const survey = await this.surveyRepo.findUniqueOrThrow({ where: { id: surveyVersionId } })

    const responseData: GetUserSurveyStepsResponse['data'] = survey.data.map((val, idx) => {
      return {
        status: surveyVersionAnswers.answers[idx].status,
        last_updated: surveyVersionAnswers.answers[idx].last_updated,
        title: val.title,
        tooltip: val.text,
      }
    })

    return { data: responseData }
  }

  /**
   * Get user survey step
   *
   * @summary Get questions and current answers for step of a survey
   */
  @Get('/survey-steps/{stepId}')
  @Security('jwt', ['Participant'])
  @Response('404', 'Not Found')
  public async getUserSurveyStep(
    @Request() request: any,
    @Path() studyId: number,
    @Path() stepId: number,
  ): Promise<GetUserSurveyStepResponse> {
    const profile = await this.profileRepo.findFirstOrThrow({
      where: { userId: request.user.userId },
    })

    const surveyVersionAnswers = await this.svaRepo.findFirstOrThrow({
      where: {
        profileId: profile.id,
        version: {
          studyId: studyId,
        },
      },
      orderBy: { versionId: 'desc' },
    })

    const surveyVersionId = surveyVersionAnswers.versionId

    const survey = await this.surveyRepo.findUniqueOrThrow({ where: { id: surveyVersionId } })

    const currentAnswers = surveyVersionAnswers.answers

    const stepData = survey.data
    if (stepData.length < stepId || stepId < 0) {
      throw new ValidateError({}, 'Invalid step')
    }

    if (currentAnswers) {
      stepData[stepId] = populateSurveyStepAnswers(stepData[stepId], currentAnswers[stepId].answers)
    }

    return { data: { ...stepData[stepId], current_step: stepId, total_steps: stepData.length } }
  }

  /**
   * Get responses for current user
   *
   * @summary Get current answers for current user by token
   */
  @Get('/survey-answers')
  @Security('jwt', ['Participant'])
  @Response('404', 'Not Found')
  public async getUserResponses(
    @Request() request: any,
    @Path() studyId: number,
  ): Promise<GetResponsesByIdResponse> {
    const participantProfile = await this.profileRepo.findFirstOrThrow({
      where: { userId: request.user.userId },
    })

    const surveyVersionAnswers = await this.svaRepo.findFirstOrThrow({
      where: {
        profileId: participantProfile.id,
        version: {
          studyId: studyId,
        },
      },
      orderBy: { versionId: 'desc' },
    })

    const survey = await this.surveyRepo.findUniqueOrThrow({
      where: { id: surveyVersionAnswers.versionId, studyId: studyId },
    })

    const currentAnswers = surveyVersionAnswers.answers

    const stepData = survey.data

    for (const step in stepData) {
      stepData[step] = populateSurveyStepAnswers(stepData[step], currentAnswers[step].answers)
      stepData[step].last_updated = currentAnswers[step].last_updated
    }

    return { data: { steps: stepData, derived_from: surveyVersionAnswers.derived || undefined } }
  }

  /**
   * Get all responses for a survey version number
   *
   * @summary Get all participants answers for a survey version
   */
  @Get('/surveys/{versionNumber}/participants/answers')
  @Security('jwt', ['OrganisationAdmin'])
  @Response('404', 'Not Found')
  public async getAllResponses(
    @Path() versionNumber: number,
    @Path() studyId: number,
  ): Promise<GetAllResponsesResponse> {
    const participant_list = await prisma.studyParticipant.findMany({
      where: { studyId },
      select: { participantProfileId: true, participantId: true },
    })

    const participant_profiles = participant_list.map((val) => val.participantProfileId)

    const participants = await this.svaRepo.findMany({
      where: {
        version: {
          studyId: studyId,
          versionNumber: versionNumber,
        },
        profileId: { in: participant_profiles },
      },
      select: {
        answers: true,
        versionId: true,
        profile: {
          select: { firstName: true, lastName: true, dob: true, familyId: true, id: true },
        },
      },
    })

    const participantsCombined = participants.map((p) => ({
      ...p,
      participantId:
        participant_list.find((val) => val.participantProfileId == p.profile.id)?.participantId ||
        'ERROR',
    }))

    const survey = await this.surveyRepo.findUniqueOrThrow({
      where: {
        studyId_versionNumber: {
          versionNumber: versionNumber,
          studyId: studyId,
        },
      },
      select: { data: true },
    })

    return { data: { surveyData: survey.data, participants: participantsCombined } }
  }

  /**
   * Get responses
   *
   * @summary Get current answers for a survey participant
   */
  @Get('/surveys/current/participants/{participantId}/answers')
  @Response('404', 'Not Found')
  @Security('jwt', ['OrganisationAdmin'])
  public async getResponsesById(
    @Path() participantId: number,
    @Path() studyId: number,
  ): Promise<GetResponsesByIdResponse> {
    const surveyVersionAnswers = await this.svaRepo.findFirstOrThrow({
      where: {
        profileId: participantId,
        version: {
          studyId: studyId,
        },
      },
      orderBy: { versionId: 'desc' },
    })

    const survey = await this.surveyRepo.findUniqueOrThrow({
      where: {
        id: surveyVersionAnswers.versionId,
        studyId: studyId,
      },
    })

    const currentAnswers = surveyVersionAnswers.answers

    const stepData = survey.data

    for (const step in stepData) {
      stepData[step] = populateSurveyStepAnswers(stepData[step], currentAnswers[step].answers)
      stepData[step].last_updated = currentAnswers[step].last_updated
    }

    return { data: { steps: stepData, derived_from: surveyVersionAnswers.derived || undefined } }
  }

  /**
   * Update survey answers
   *
   * @summary Update survey answers for current user by token
   */
  @Post('/survey-answers')
  @Security('jwt', ['Participant'])
  @Response('404', 'Not Found')
  @Response<ValidateErrorResponse>('422', 'Validation Failed')
  public async updateSurveyAnswers(
    @Request() request: any,
    @Path() studyId: number,
    @Body() body: UpdateSurveyAnswersRequest,
  ) {
    const { step, data } = body

    const profile = await this.profileRepo.findFirstOrThrow({
      where: {
        userId: request.user.userId,
        studies: {
          some: {
            studyId,
          },
        },
      },
    })

    const participantAnswers = await this.svaRepo.findFirstOrThrow({
      where: {
        profileId: profile.id,
        version: {
          studyId: studyId,
        },
      },
      orderBy: { versionId: 'desc' },
    })

    const survey = await this.surveyRepo.findUniqueOrThrow({
      where: { id: participantAnswers.versionId, studyId: studyId },
    })

    if (survey.status !== 'PUBLISHED') {
      throw Error('Cannot submit answers for unpublished survey version')
    }

    const surveySteps = survey.data

    const answers = participantAnswers.answers

    type StatusMap = {
      [key in SurveyElementType]: SurveyStepStatus
    }

    const statusMap: StatusMap = {
      video: 'viewed',
      subheading: 'viewed',
      'question-checkbox': 'completed',
      'question-choices': 'completed',
    }

    //Maps the type of the first element to the updated status
    const status = statusMap[surveySteps[step].elements[0]?.type || 'subheading']

    if (!validateAnswers(surveySteps[step], data)) {
      throw new ValidateError({}, 'Answers did not match survey question structure')
    }

    answers[step].status = status
    answers[step].answers = data
    answers[step].last_updated = new Date().toISOString()

    await this.svaRepo.update({
      where: {
        id: participantAnswers.id,
      },
      data: { answers, derived: null },
    })

    //Also update any dependents
    if (profile.participantType == 'GUARDIAN') {
      const dependents = await this.profileRepo.findMany({
        where: {
          familyId: profile.familyId,
          studies: {
            some: {
              studyId,
            },
          },
          OR: [{ participantType: 'DEPENDENT_AGE' }, { participantType: 'DEPENDENT_OTHER' }],
        },
      })

      const coGuardians = await this.profileRepo.findMany({
        where: {
          NOT: { id: profile.id },
          familyId: profile.familyId,
          participantType: 'GUARDIAN',
          studies: {
            some: {
              studyId,
            },
          },
        },
      })

      if (coGuardians) {
        const coGuardianSPPromises = coGuardians.map(
          async (val) =>
            await this.svaRepo.findFirstOrThrow({
              where: {
                profileId: val.id,
                versionId: participantAnswers.versionId,
                version: {
                  studyId: studyId,
                },
              },
            }),
        )
        const coGuardianSP_ls = await Promise.all(coGuardianSPPromises)

        //const coGuardianAnswers = coGuardianSP.answers
        answers[step].answers = combineGuardianAnswers([
          answers[step].answers,
          ...coGuardianSP_ls.map((val) => val.answers[step].answers),
        ])
      }

      for (const dep of dependents) {
        const sva = await this.svaRepo.findFirstOrThrow({
          where: {
            profileId: dep.id,
            versionId: participantAnswers.versionId,
            version: {
              studyId: studyId,
            },
          },
        })

        const derived = [profile, ...coGuardians]
          .map((val) => `${val.firstName} ${val.lastName}`)
          .join(',')

        await this.svaRepo.update({
          where: {
            id: sva.id,
            version: {
              studyId: studyId,
            },
          },
          data: {
            answers,
            derived,
          },
        })

        await prisma.auditLog.create({
          data: {
            resource: 'SurveyVersionAnswers',
            operation: 'UPDATE',
            meta: {
              reource: 'SurveyVersionAnswers',
              id: sva.id,
              message: 'Recalculated answers of dependent based on guardians answers',
              derivedFrom: derived,
              previousAnswers: sva.answers,
              newAnsers: answers,
            },
          },
        })
      }
    }
  }

  /**
   *
   * @summary Update draft survey by versionNumber
   */
  @Patch('/surveys/{versionNumber}')
  @Response('404', 'Not Found')
  @Response<ValidateErrorResponse>('422', 'Validation Failed')
  @Security('jwt', ['OrganisationAdmin'])
  public async updateSurvey(
    @Path() studyId: number,
    @Path() versionNumber: number,
    @Body() bodyRequest: UpdateSurveyRequest,
  ) {
    const survey = await this.surveyRepo.findUniqueOrThrow({
      where: {
        studyId_versionNumber: {
          studyId: studyId,
          versionNumber: versionNumber,
        },
      },
    })

    if (survey.status == 'PUBLISHED') {
      throw Error('Cannot edit a published survey')
    }

    await this.surveyRepo.update({
      where: {
        studyId_versionNumber: {
          studyId: studyId,
          versionNumber: versionNumber,
        },
      },
      data: { data: bodyRequest.data as any },
    })
  }

  /**
   *
   * @summary Publish a draft survey
   */
  @Post('/surveys/{versionNumber}/publish')
  @Response('404', 'Not Found')
  @Response<ValidateErrorResponse>('422', 'Validation Failed')
  @Security('jwt', ['OrganisationAdmin'])
  public async publishSurvey(@Path() studyId: number, @Path() versionNumber: number) {
    const survey = await this.surveyRepo.findUniqueOrThrow({
      where: {
        studyId_versionNumber: {
          studyId: studyId,
          versionNumber: versionNumber,
        },
      },
    })

    if (survey.status != 'DRAFT') {
      throw Error('Can only publish a draft survey')
    }

    //Validate questions
    for (const step of survey.data) {
      for (const element of step.elements) {
        if (element.type == 'question-choices') {
          if (element.data.choices.length == 0) {
            throw new ValidateError(
              { Question: { message: 'A multi-choice question is missing choices' } },
              'Question is missing choices',
            )
          }
        }
        if (
          (element.type == 'question-checkbox' || element.type == 'question-choices') &&
          element.data.text == ''
        ) {
          throw new ValidateError(
            { question: { message: 'A question is missing text' } },
            'Missing question text',
          )
        }
      }
    }

    const newSurveyVersion = await this.surveyRepo.create({
      // Increment versionNumber
      data: {
        status: 'DRAFT',
        data: survey.data,
        studyId: studyId,
        versionNumber: survey.versionNumber + 1,
      },
    })

    await this.surveyRepo.update({
      where: {
        studyId_versionNumber: {
          studyId: studyId,
          versionNumber: versionNumber,
        },
      },
      data: { status: 'PUBLISHED', publishedAt: new Date() },
    })

    const profiles = await this.profileRepo.findMany({
      where: {
        studies: {
          some: {
            studyId: studyId,
          },
        },
      },
    })

    //Carry across answers from previous if they exist

    const participants = profiles.map(async (val) => {
      const previousSurveyVersionAnswers = await this.svaRepo.findFirst({
        where: {
          profileId: val.id,
          version: {
            studyId: studyId,
          },
        },
        orderBy: { versionId: 'desc' },
        select: { answers: true, version: { select: { createdAt: true, id: true } } },
      })

      let answers
      if (previousSurveyVersionAnswers) {
        const previousSurveyVersion = await this.surveyRepo.findFirstOrThrow({
          where: {
            id: previousSurveyVersionAnswers.version.id,
            studyId: studyId,
          },
        })
        answers = answersFromPreviousSurvey(
          previousSurveyVersion,
          newSurveyVersion, // Created above with incremented VersionNumber
          previousSurveyVersionAnswers.answers,
        )
      } else {
        answers = createDefaultAnswers(survey.data)
      }

      return {
        versionId: survey.id,
        profileId: val.id,
        answers,
      }
    })

    await this.svaRepo.createMany({ data: await Promise.all(participants) })
  }
}
