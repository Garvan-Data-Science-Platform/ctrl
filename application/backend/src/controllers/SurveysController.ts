/* eslint-disable  @typescript-eslint/no-explicit-any */

import {
  Get,
  Body,
  Request,
  Post,
  Route,
  Tags,
  Path,
  SuccessResponse,
  Response,
  Controller,
  Security,
  Patch,
  ValidateError,
} from 'tsoa'
import logger from 'common/src/logger'
import type {
  GetResponsesByIdResponse,
  GetSurveyVersionsResponse,
  GetUserSurveyStepResponse,
  GetUserSurveyStepsResponse,
  UpdateSurveyAnswersRequest,
  UpdateSurveyAnswersResponse,
  UpdateSurveyRequest,
  UpdateSurveyResponse,
} from 'common/types/api/surveys'
import { SurveyVersion as SurveyVersionPrisma } from '@prisma/client'
import { SurveyElementType, SurveyStep, SurveyStepStatus } from 'common/types/survey'
import prisma from '../PrismaClient'
import '../jsontypes'
import { GetSurveyVersionByIdResponse } from 'common/types/api/surveys/getSurveyVersionById'
import { validateAnswers } from 'common/src/surveys/validateSurveyAnswers'
import { createDefaultAnswers } from 'common/src/surveys/createDefaultAnswers'
import { populateSurveyStepAnswers } from 'common/src/surveys/populateSurveyStepAnswers'
import SurveyResponses from 'common/example_responses/getResponsesById.json'

@Route('surveys')
@Tags('Surveys')
export class SurveysController extends Controller {
  surveyRepo = prisma.surveyVersion
  spRepo = prisma.surveyParticipant
  profileRepo = prisma.participantProfile

  /**
   * Get all Surveys
   *
   * @summary Get all Surveys
   */
  @Get('/')
  @SuccessResponse('200', 'OK')
  @Response('500', 'Internal Server Error')
  @Response('401', 'Unauthorized')
  @Security('jwt', ['OrganisationAdmin'])
  public async getAllSurveys(): Promise<GetSurveyVersionsResponse> {
    const surveys: SurveyVersionPrisma[] = await this.surveyRepo.findMany({
      orderBy: [{ id: 'desc' }],
    })
    if (surveys.length == 0) {
      const initial_survey = await this.surveyRepo.create({
        data: { versionNumber: 1, data: [], status: 'DRAFT' },
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
  @SuccessResponse('200', 'OK')
  @Response('500', 'Internal Server Error')
  @Response('404', 'Not Found')
  @Response('401', 'Unauthorized')
  @Security('jwt')
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
  @SuccessResponse('200', 'OK')
  @Response('500', 'Internal Server Error')
  @Response('404', 'Not Found')
  @Response('401', 'Unauthorized')
  @Security('jwt', ['OrganisationAdmin'])
  public async addParticipant(
    @Request() request: any,
    @Path() surveyId: number,
  ): Promise<UpdateSurveyResponse> {
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

    const responseData = {
      message: `Added user as participant to survey: ${surveyId}`,
    }
    logger.info({ ...responseData })
    return responseData
  }

  /**
   * Get user survey steps
   *
   * @summary Get survey steps for current user
   */
  @Get('/steps/:study')
  @SuccessResponse('200', 'OK')
  @Response('500', 'Internal Server Error')
  @Response('404', 'Not Found')
  @Response('401', 'Unauthorized')
  @Security('jwt')
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

    surveyParticipant.answers[0].status

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
  @SuccessResponse('200', 'OK')
  @Response('500', 'Internal Server Error')
  @Response('404', 'Not Found')
  @Response('401', 'Unauthorized')
  @Security('jwt')
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
   * Get responses
   *
   * @summary Get all responses for a survey participant
   */
  @Get('/responses/:participantId')
  @SuccessResponse('200', 'OK')
  @Response('500', 'Internal Server Error')
  @Response('404', 'Not Found')
  @Response('401', 'Unauthorized')
  public async getResponsesById() //@Request() request: any,
  //@Path() participantId: number,
  : Promise<GetResponsesByIdResponse> {
    return SurveyResponses as GetResponsesByIdResponse
  }

  /**
   * Update survey answers
   *
   * @summary Update a Survey
   */
  @Post('/answers')
  @SuccessResponse('200', 'OK')
  @Response('500', 'Internal Server Error')
  @Response('404', 'Not Found')
  @Response('401', 'Unauthorized')
  @Security('jwt')
  public async updateSurveyAnswers(
    @Request() request: any,
    @Body() body: UpdateSurveyAnswersRequest,
  ): Promise<UpdateSurveyAnswersResponse> {
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
    const status = statusMap[surveySteps[step].elements[0].type]

    if (!validateAnswers(surveySteps[step], data)) {
      throw new ValidateError({}, 'Answers did not match survey question structure')
    }

    answers[step].status = status
    answers[step].answers = data
    answers[step].last_updated = new Date().toISOString()

    const responseData = {
      message: 'Updated Answers',
    }

    await this.spRepo.update({
      where: { id: participant.id }, //
      data: { answers },
    })

    logger.info({ ...responseData })
    return responseData
  }

  /**
   *
   * @summary Update draft survey
   */
  @Patch('/{surveyId}')
  @SuccessResponse('200', 'OK')
  @Response('500', 'Internal Server Error')
  @Response('404', 'Not Found')
  @Response('401', 'Unauthorized')
  @Security('jwt', ['OrganisationAdmin'])
  public async updateSurvey(
    @Path() surveyId: number,
    @Body() bodyRequest: UpdateSurveyRequest,
  ): Promise<UpdateSurveyResponse> {
    const survey = await this.surveyRepo.findUniqueOrThrow({ where: { id: surveyId } })

    if (survey.status == 'PUBLISHED') {
      throw Error('Cannot edit a published survey')
    }

    await this.surveyRepo.update({
      where: { id: surveyId },
      data: { data: bodyRequest.data as any },
    })

    const responseData = {
      message: `Updated survey with ID: ${surveyId}`,
    }
    logger.info({ ...responseData })
    return responseData
  }

  /**
   *
   * @summary Publish a draft survey
   */
  @Post('/publish/{surveyId}')
  @SuccessResponse('200', 'OK')
  @Response('500', 'Internal Server Error')
  @Response('404', 'Not Found')
  @Response('401', 'Unauthorized')
  @Security('jwt', ['OrganisationAdmin'])
  public async publishSurvey(@Path() surveyId: number): Promise<UpdateSurveyResponse> {
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

    const participants = profiles.map((val) => ({
      versionId: survey.id,
      profileId: val.id,
      answers: createDefaultAnswers(survey.data),
    }))

    await this.spRepo.createMany({ data: participants })

    const responseData = {
      message: `Published survey with ID: ${surveyId}`,
    }
    logger.info({ ...responseData })
    return responseData
  }
}
