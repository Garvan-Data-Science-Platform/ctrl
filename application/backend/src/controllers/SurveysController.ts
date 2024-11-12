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
} from 'tsoa'
import logger from 'common/src/logger'
import type {
  GetSurveyVersionsResponse,
  UpdateSurveyAnswersRequest,
  UpdateSurveyAnswersResponse,
  UpdateSurveyRequest,
  UpdateSurveyResponse,
} from 'common/types/api/surveys'
import { SurveyVersion as SurveyVersionPrisma } from '@prisma/client'
import {
  SurveyElementType,
  SurveyStep,
  UserSurveyStepState,
  SurveyStepStatus,
} from 'common/types/survey'
import prisma from '../PrismaClient'
import { GetSurveyVersionByIdResponse } from 'common/types/api/surveys/getSurveyVersionById'
import { validateAnswers } from 'utils/validateSurveyAnswers'
import { createEmptyAnswers } from 'utils/createEmptyAnswers'

@Route('surveys')
@Tags('Surveys')
@Security('jwt')
export class SurveysController extends Controller {
  surveyRepo = prisma.surveyVersion
  answersRepo = prisma.surveyAnswers

  /**
   * Get all Surveys
   *
   * @summary Get all Surveys
   */
  @Get('/')
  @SuccessResponse('200', 'OK')
  @Response('500', 'Internal Server Error')
  @Response('401', 'Unauthorized')
  public async getAllSurveys(): Promise<GetSurveyVersionsResponse> {
    const surveys: SurveyVersionPrisma[] = await this.surveyRepo.findMany({})
    if (surveys.length == 0) {
      const initial_survey = await this.surveyRepo.create({ data: { data: [], status: 'DRAFT' } })
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
      data: { id: surveyID, data: survey.data as unknown as SurveyStep[] },
    }
    logger.info({ ...responseData })
    return responseData
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
  public async updateSurveyAnswers(
    @Request() request: any,
    @Body() bodyRequest: UpdateSurveyAnswersRequest,
  ): Promise<UpdateSurveyAnswersResponse> {
    const { step, data, surveyVersionId } = bodyRequest
    const currentAnswers = await this.answersRepo.findFirst({
      where: { versionId: surveyVersionId, userId: request.user.userId },
    })

    let answers: UserSurveyStepState[]

    const survey = await this.surveyRepo.findUniqueOrThrow({
      where: { id: surveyVersionId },
    })

    if (survey.status !== 'PUBLISHED') {
      throw Error('Cannot submit answers for unpublished survey version')
    }

    const surveySteps = survey?.data as unknown as SurveyStep[]

    if (currentAnswers === null) {
      answers = createEmptyAnswers(surveySteps)
    } else {
      answers = currentAnswers.data as unknown as UserSurveyStepState[]
    }

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
      throw Error('Answers did not match survey question structure')
    }

    answers[step].status = status
    answers[step].answers = data

    const responseData = {
      message: 'Updated Answers',
    }

    if (currentAnswers) {
      await this.answersRepo.update({
        where: { id: currentAnswers.id }, //
        data: { data: answers as any },
      })
    } else {
      await this.answersRepo.create({
        data: { data: answers as any, userId: request.user.userId, versionId: surveyVersionId },
      })
      responseData.message = 'Created new answers'
    }

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
}
