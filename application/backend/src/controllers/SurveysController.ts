import { Get, Route, Tags, Path, SuccessResponse, Response, Controller, Security } from 'tsoa'
import logger from 'common/src/logger'
import type { GetSurveyVersionsResponse } from 'common/types/api/surveys'
import { SurveyVersion as SurveyVersionPrisma } from '@prisma/client'
import { SurveyStep } from 'common/types/survey'
import prisma from '../PrismaClient'
import { GetSurveyVersionByIdResponse } from 'common/types/api/surveys/getSurveyVersionById'
import versionsResponse from 'common/example_responses/getSurveyVersions.json'

@Route('surveys')
@Tags('Surveys')
@Security('jwt')
export class SurveysController extends Controller {
  surveyRepo = prisma.surveyVersion

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
    //const surveys: SurveyVersionPrisma[] = await this.surveyRepo.findMany({})
    const responseData = versionsResponse //{ data: versions }
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
}

/**
 * Update an existing survey.
 *
 * @summary Update a Survey
 */
/*
  @Patch('/{surveyID}')
  @SuccessResponse('200', 'OK')
  @Response('500', 'Internal Server Error')
  @Response('404', 'Not Found')
  @Response('401', 'Unauthorized')
  public async updateSurvey(
    @Path() surveyID: number,
    @Body() bodyRequest: UpdateSurveyRequest,
  ): Promise<UpdateSurveyResponse> {
    try {
      const updatedSurvey = await this.surveyRepo.update({
        where: { id: surveyID },
        data: bodyRequest,
      })
      const responseData = {
        message: `Updated survey with ID: ${surveyID}`,
        updatedSurvey,
      }
      logger.info({ ...responseData })
      return responseData
    } catch (err) {
      const error = { message: `Survey with ID: ${surveyID} not found`, updatedSurvey: null }
      logger.error({ ...error })
      this.setStatus(404)
      return error
    }
  }
  */
