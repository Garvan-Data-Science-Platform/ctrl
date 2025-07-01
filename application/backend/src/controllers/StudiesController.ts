import {
  Get,
  Body,
  Post,
  Patch,
  Delete,
  Route,
  Tags,
  Path,
  Response,
  Request,
  SuccessResponse,
  Middlewares,
  Controller,
  Security,
} from 'tsoa'
import logger from 'common/src/logger'
import type {
  GetAllStudiesResponse,
  GetStudyByIdResponse,
  CreateStudyRequest,
  CreateStudyResponse,
  UpdateStudyRequest,
} from 'common/types/api/studies'
import prisma from '../PrismaClient'
import { Study } from '@prisma/client'
import { NotFoundError } from '../middlewares/ErrorHandler'
import {
  ValidateErrorResponse,
  NotFoundErrorResponse,
  UnauthorizedErrorResponse,
} from 'common/types/api/errors'
import { auditLog } from '../middlewares/AuditLog'

@Route('studies')
@Tags('Studies')
@Response('500', 'Internal Server Error')
@Response<UnauthorizedErrorResponse>('401', 'Unauthorized')
@Security('jwt', ['OrganisationAdmin'])
@Middlewares(auditLog)
export class StudiesController extends Controller {
  studyRepo = prisma.study
  studyParticipantRepo = prisma.studyParticipant
  profileRepo = prisma.participantProfile

  /**
   * Get all Studies
   *
   * @summary Get all Studies
   */
  @Get('/')
  public async getAllStudies(): Promise<GetAllStudiesResponse> {
    const studies: Study[] = await this.studyRepo.findMany({})
    const responseData = { data: studies }
    logger.info({ ...responseData })
    return responseData
  }

  /**
   * List users Studies
   *
   * @summary List all Studies that a user is participating in, by token (doesn't include pending invitations)
   */
  @Get('/list')
  @Security('jwt', ['Participant'])
  public async listStudies(@Request() request: any): Promise<GetAllStudiesResponse> {
    // get profile id from token
    const participantProfile = await this.profileRepo.findFirstOrThrow({
      where: { userId: request.user.userId },
    })

    const studies: Study[] = await this.studyRepo.findMany({
      where: {
        profiles: {
          some: {
            participantProfileId: participantProfile.id,
          },
        },
      },
    })
    const responseData = { data: studies }
    logger.info({ ...responseData })
    return responseData
  }

  /**
   * Gets a Specific Study by ID
   *
   * @summary Get Specific Study by Id
   */
  @Get('/{studyId}')
  public async getStudyById(@Path() studyId: number): Promise<GetStudyByIdResponse> {
    const study: Study | null = await this.studyRepo.findUnique({ where: { id: studyId } })
    if (!study) {
      const errorMessage: string = `Study with ID: ${studyId} not found`
      logger.error({ errorMessage })
      throw new NotFoundError(errorMessage)
    }
    const responseData = { data: study }
    logger.info({ ...responseData })
    return responseData
  }

  /**
   * Create a new study.
   *
   * @summary Create a new Study
   */
  @Post('/')
  @SuccessResponse('201', 'Created')
  @Response<ValidateErrorResponse>('422', 'Validation Failed')
  public async createStudy(@Body() bodyRequest: CreateStudyRequest): Promise<CreateStudyResponse> {
    try {
      const newStudy = await this.studyRepo.create({
        data: { name: bodyRequest.name }, // Note: Study also has email invite info, but this is set via UI
      })
      const responseData = {
        id: newStudy.id,
      }
      logger.info({ ...responseData })
      return responseData
    } catch (err) {
      const errorMessage: string = 'Error creating study'
      logger.error({ errorMessage, err })
      throw new Error(errorMessage)
    }
  }

  /**
   * Update an existing study.
   *
   * @summary Update an existing Study
   */
  @Patch('/{studyId}')
  @Response<NotFoundErrorResponse>('404', 'Not Found')
  @Response<ValidateErrorResponse>('422', 'Validation Failed')
  public async updateStudy(@Path() studyId: number, @Body() bodyRequest: UpdateStudyRequest) {
    try {
      await this.studyRepo.update({
        where: { id: studyId },
        data: bodyRequest,
      })
    } catch (err) {
      const errorMessage: string = `Study with ID: ${studyId} not found`
      logger.error({ errorMessage, err })
      throw new NotFoundError(errorMessage)
    }
  }

  /**
   * Delete a study
   *
   * @summary Delete a study
   */
  @Delete('/{studyId}')
  @Response<NotFoundErrorResponse>('404', 'Not Found')
  public async deleteStudy(@Path() studyId: number) {
    try {
      await this.studyRepo.delete({
        where: { id: studyId },
        include: { surveys: true },
      })
      return
    } catch (err) {
      const errorMessage: string = `Study with ID: ${studyId} not found`
      logger.error({ errorMessage, err })
      throw new NotFoundError(errorMessage)
    }
  }
}
