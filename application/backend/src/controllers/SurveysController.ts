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
  GetResponsesByIdResponse,
  GetSurveyVersionsResponse,
  GetUserSurveyStepResponse,
  GetUserSurveyStepsResponse,
  UpdateSurveyAnswersRequest,
  UpdateSurveyRequest,
} from 'common/types/api/surveys'
import { SurveyVersion as SurveyVersionPrisma } from '@prisma/client'
import { SurveyElementType, SurveyStep, SurveyStepStatus } from 'common/types/survey'
import prisma from '../PrismaClient'
import '../jsontypes'
import { GetSurveyVersionByIdResponse } from 'common/types/api/surveys/getSurveyVersionById'
import { validateAnswers } from 'common/src/surveys/validateSurveyAnswers'
import { populateSurveyStepAnswers } from 'common/src/surveys/populateSurveyStepAnswers'
import { ValidateErrorResponse } from 'common/types/api/errors'
import {
  answersFromPreviousSurvey,
  combineGuardianAnswers,
  createDefaultAnswers,
} from '../utils/answers'
import { auditLog } from '../middlewares/AuditLog'

@Route('surveys')
@Tags('Surveys')
@Response('500', 'Internal Server Error')
@Response('401', 'Unauthorized')
@Middlewares(auditLog)
export class SurveysController extends Controller {
  surveyRepo = prisma.surveyVersion
  spRepo = prisma.surveyParticipant
  profileRepo = prisma.participantProfile
  auditLogRepo = prisma.auditLog

  /**
   * Get all Surveys
   *
   * @summary Get all Surveys
   */
  @Get('/')
  @Security('jwt', ['OrganisationAdmin'])
  public async getAllSurveys(): Promise<GetSurveyVersionsResponse> {
    const surveys: SurveyVersionPrisma[] = await this.surveyRepo.findMany({
      orderBy: [{ id: 'desc' }],
    })
    if (surveys.length == 0) {
      const study = await prisma.study.create({})
      const initial_survey = await this.surveyRepo.create({
        data: { versionNumber: 1, data: [], status: 'DRAFT', studyId: study.id },
      })
      surveys.push(initial_survey)
    }
    const responseData = { data: surveys }
    logger.info({ ...responseData })
    return responseData
  }

  /**
   * Gets a Specific Survey using their ID
   *
   * @summary Get Specific Survey
   */
  @Get('/{surveyID}')
  @Response('404', 'Not Found')
  public async getSurveyVersionById(
    @Path() surveyID: number,
  ): Promise<GetSurveyVersionByIdResponse> {
    const survey: SurveyVersionPrisma | null = await this.surveyRepo.findUnique({
      where: { id: surveyID },
    })
    if (!survey) {
      const error = { message: `Survey with ID: ${surveyID} not found`, data: survey }
      logger.error({ ...error })
      this.setStatus(404)
      throw Error('NO GOOD')
    }
    const responseData: GetSurveyVersionByIdResponse = {
      data: { id: surveyID, status: survey.status, data: survey.data as unknown as SurveyStep[] },
    }
    logger.info({ ...responseData })
    return responseData
  }

  /**
   *
   * @summary Add participant to survey
   */
  @Post('/participant/{surveyId}')
  @Response('404', 'Not Found')
  @Security('jwt', ['OrganisationAdmin'])
  public async addParticipant(@Request() request: any, @Path() surveyId: number) {
    const survey = await this.surveyRepo.findUniqueOrThrow({ where: { id: surveyId } })

    if (survey.status != 'PUBLISHED') {
      throw Error('Can only add to a published survey')
    }

    const profile = await this.profileRepo.findFirstOrThrow({
      where: { userId: request.user.userId }, //TODO: STUDYID
    })

    const defaultAnswers = createDefaultAnswers(survey.data)

    await this.spRepo.create({
      data: {
        profileId: profile.id,
        versionId: survey.id,
        answers: defaultAnswers,
      },
    })
  }

  /**
   * Get user survey steps
   *
   * @summary Get survey steps for current user
   */
  @Get('/steps/:study')
  @Response('404', 'Not Found')
  public async getUserSurveySteps(
    @Request() request: any,
    //eslint-disable-next-line
    @Path() study: number,
  ): Promise<GetUserSurveyStepsResponse> {
    const profile = await this.profileRepo.findFirstOrThrow({
      where: { userId: request.user.userId },
    })

    const surveyParticipant = await this.spRepo.findFirstOrThrow({
      where: { profileId: profile.id },
      orderBy: { versionId: 'desc' },
    })

    const surveyVersionId = surveyParticipant.versionId

    const survey = await this.surveyRepo.findUniqueOrThrow({ where: { id: surveyVersionId } })

    const responseData: GetUserSurveyStepsResponse['data'] = survey.data.map((val, idx) => {
      return {
        status: surveyParticipant.answers[idx].status,
        last_updated: surveyParticipant.answers[idx].last_updated,
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
  @Get('/step/:study/:step')
  @Response('404', 'Not Found')
  public async getUserSurveyStep(
    @Request() request: any,
    @Path() study: number,
    @Path() step: number,
  ): Promise<GetUserSurveyStepResponse> {
    const profile = await this.profileRepo.findFirstOrThrow({
      where: { userId: request.user.userId },
    })

    const surveyParticipant = await this.spRepo.findFirstOrThrow({
      where: { profileId: profile.id },
      orderBy: { versionId: 'desc' },
    })

    const surveyVersionId = surveyParticipant.versionId

    const survey = await this.surveyRepo.findUniqueOrThrow({ where: { id: surveyVersionId } })

    const currentAnswers = surveyParticipant.answers

    const stepData = survey.data
    if (stepData.length < step || step < 0) {
      throw new ValidateError({}, 'Invalid step')
    }

    if (currentAnswers) {
      stepData[step] = populateSurveyStepAnswers(stepData[step], currentAnswers[step].answers)
    }

    return { data: { ...stepData[step], current_step: step, total_steps: stepData.length } }
  }

  /**
   * Get responses for current user
   *
   * @summary Get all responses for current user by token
   */
  @Get('/responses/current')
  @Response('404', 'Not Found')
  public async getUserResponses(@Request() request: any): Promise<GetResponsesByIdResponse> {
    const participantProfile = await this.profileRepo.findFirstOrThrow({
      where: { userId: request.user.userId },
    })

    const surveyParticipant = await this.spRepo.findFirstOrThrow({
      where: { profileId: participantProfile.id },
    })

    const survey = await this.surveyRepo.findUniqueOrThrow({
      where: { id: surveyParticipant.versionId },
    })

    const currentAnswers = surveyParticipant.answers

    const stepData = survey.data

    for (const step in stepData) {
      stepData[step] = populateSurveyStepAnswers(stepData[step], currentAnswers[step].answers)
      stepData[step].last_updated = currentAnswers[step].last_updated
    }

    return { data: { steps: stepData, derived_from: surveyParticipant.derived || undefined } }
  }

  /**
   * Get responses
   *
   * @summary Get all responses for a survey participant
   */
  @Get('/responses/:participantId')
  @Response('404', 'Not Found')
  @Security('jwt', ['OrganisationAdmin'])
  public async getResponsesById(@Path() participantId: number): Promise<GetResponsesByIdResponse> {
    const surveyParticipant = await this.spRepo.findUniqueOrThrow({
      where: { id: participantId },
    })

    const survey = await this.surveyRepo.findUniqueOrThrow({
      where: { id: surveyParticipant.versionId },
    })

    const currentAnswers = surveyParticipant.answers

    const stepData = survey.data

    for (const step in stepData) {
      stepData[step] = populateSurveyStepAnswers(stepData[step], currentAnswers[step].answers)
      stepData[step].last_updated = currentAnswers[step].last_updated
    }

    return { data: { steps: stepData, derived_from: surveyParticipant.derived || undefined } }
  }

  /**
   * Update survey answers
   *
   * @summary Update a Survey
   */
  @Post('/answers')
  @Response('404', 'Not Found')
  @Response<ValidateErrorResponse>('422', 'Validation Failed')
  public async updateSurveyAnswers(
    @Request() request: any,
    @Body() body: UpdateSurveyAnswersRequest,
  ) {
    const { step, data } = body

    const profile = await this.profileRepo.findFirstOrThrow({
      //TODO STUDY ID
      where: { userId: request.user.userId },
    })

    const participant = await this.spRepo.findFirstOrThrow({
      where: { profileId: profile.id },
      orderBy: { versionId: 'desc' },
    })

    const survey = await this.surveyRepo.findUniqueOrThrow({
      where: { id: participant.versionId },
    })

    if (survey.status !== 'PUBLISHED') {
      throw Error('Cannot submit answers for unpublished survey version')
    }

    const surveySteps = survey.data

    const answers = participant.answers

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

    await this.spRepo.update({
      where: { id: participant.id }, //
      data: { answers, derived: null },
    })

    //Also update any dependents
    if (profile.participantType == 'GUARDIAN') {
      const dependents = await this.profileRepo.findMany({
        where: {
          familyId: profile.familyId,
          OR: [{ participantType: 'DEPENDENT_AGE' }, { participantType: 'DEPENDENT_OTHER' }],
        },
      })

      const coGuardians = await this.profileRepo.findMany({
        where: { NOT: { id: profile.id }, familyId: profile.familyId, participantType: 'GUARDIAN' },
      })

      if (coGuardians) {
        const coGuardianSPPromises = coGuardians.map(
          async (val) =>
            await this.spRepo.findFirstOrThrow({
              where: { profileId: val.id, versionId: participant.versionId },
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
        const sp = await this.spRepo.findFirstOrThrow({
          where: { profileId: dep.id, versionId: participant.versionId },
        })
        await this.spRepo.update({
          where: { id: sp.id }, //
          data: {
            answers,
            derived: [profile, ...coGuardians]
              .map((val) => `${val.firstName} ${val.lastName}`)
              .join(','),
          },
        })
      }
    }
  }

  /**
   *
   * @summary Update draft survey
   */
  @Patch('/{surveyId}')
  @Response('404', 'Not Found')
  @Response<ValidateErrorResponse>('422', 'Validation Failed')
  @Security('jwt', ['OrganisationAdmin'])
  public async updateSurvey(@Path() surveyId: number, @Body() bodyRequest: UpdateSurveyRequest) {
    const survey = await this.surveyRepo.findUniqueOrThrow({ where: { id: surveyId } })

    if (survey.status == 'PUBLISHED') {
      throw Error('Cannot edit a published survey')
    }

    await this.surveyRepo.update({
      where: { id: surveyId },
      data: { data: bodyRequest.data as any },
    })
  }

  /**
   *
   * @summary Publish a draft survey
   */
  @Post('/publish/{surveyId}')
  @Response('404', 'Not Found')
  @Response<ValidateErrorResponse>('422', 'Validation Failed')
  @Security('jwt', ['OrganisationAdmin'])
  public async publishSurvey(@Path() surveyId: number) {
    const survey = await this.surveyRepo.findUniqueOrThrow({ where: { id: surveyId } })

    if (survey.status != 'DRAFT') {
      throw Error('Can only publish a draft survey')
    }

    await this.surveyRepo.create({
      data: { status: 'DRAFT', data: survey.data, versionNumber: survey.versionNumber + 1 },
    })

    await this.surveyRepo.update({
      where: { id: surveyId },
      data: { status: 'PUBLISHED' },
    })

    const profiles = await this.profileRepo.findMany({})

    //Carry across answers from previous if they exist

    const participants = profiles.map(async (val) => {
      const previousSurveyParticipant = await this.spRepo.findFirst({
        where: { profileId: val.id },
        orderBy: { versionId: 'desc' },
        select: { answers: true, version: { select: { createdAt: true, id: true } } },
      })

      let answers
      if (previousSurveyParticipant) {
        const previousSurveyVersion = await this.surveyRepo.findFirstOrThrow({
          where: { id: previousSurveyParticipant.version.id },
        })
        const currentSurveyVersion = await this.surveyRepo.findFirstOrThrow({
          where: { id: surveyId },
        })
        answers = answersFromPreviousSurvey(
          previousSurveyVersion,
          currentSurveyVersion,
          previousSurveyParticipant.answers,
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

    await this.spRepo.createMany({ data: await Promise.all(participants) })
  }
}
