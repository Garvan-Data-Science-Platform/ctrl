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
  UploadedFile,
  NoSecurity,
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
import { NotFoundError, UnprocessableError } from '../middlewares/ErrorHandler'
import {
  ValidateErrorResponse,
  NotFoundErrorResponse,
  UnauthorizedErrorResponse,
} from 'common/types/api/errors'
import { auditLog } from '../middlewares/AuditLog'
import sharp from 'sharp'
import { Readable } from 'stream'
import { SettingsController } from './SettingsController'
import type { RequestWithAuthentication } from 'authentication'

@Route('studies')
@Tags('Studies')
@Response('500', 'Internal Server Error')
@Response<UnauthorizedErrorResponse>('401', 'Unauthorized')
@Security('jwt', ['OrganisationAdmin', 'StudyAdmin'])
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
  public async getAllStudies(
    @Request() request: RequestWithAuthentication,
  ): Promise<GetAllStudiesResponse> {
    const studies: Study[] = await this.studyRepo.findMany({
      where: { id: { in: request.user.studies } },
      orderBy: { id: 'asc' },
    })
    const responseData = { data: studies.map((val) => ({ ...val, logo: Boolean(val.logo) })) }
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
  public async listStudies(
    @Request() request: RequestWithAuthentication,
  ): Promise<GetAllStudiesResponse> {
    // get profile id from token
    const participantProfile = await this.profileRepo.findFirstOrThrow({
      where: { userId: request.user.userId },
    })

    const studies = await this.studyParticipantRepo.findMany({
      where: { participantProfileId: participantProfile.id, study: { deleted: false } },
      select: { study: true },
    })

    const responseData = {
      data: studies.map((val) => ({ ...val.study, logo: Boolean(val.study.logo) })),
    }
    logger.info({ ...responseData })
    return responseData
  }

  /**
   * Get deleted Studies
   *
   * @summary Get deleted Studies
   */
  @Get('/deleted')
  public async getDeletedStudies(
    @Request() request: RequestWithAuthentication,
  ): Promise<GetAllStudiesResponse> {
    if (
      (await prisma.user.findUniqueOrThrow({ where: { id: request.user.userId } })).role ==
      'StudyAdmin'
    ) {
      return { data: [] }
    }
    const studies: Study[] = await this.studyRepo.findMany({
      where: { deleted: true },
      orderBy: { id: 'asc' },
    })
    const responseData = { data: studies.map((val) => ({ ...val, logo: Boolean(val.logo) })) }
    return responseData
  }

  /**
   * Restores a Deleted Study by ID
   *
   * @summary Restore Deleted Study by Id
   */
  @Patch('{studyId}/restore')
  @Security('jwt', ['OrganisationAdmin'])
  public async restoreStudyById(@Path() studyId: number) {
    await this.studyRepo.update({
      where: { id: studyId, deleted: true },
      data: { deleted: false },
    })
  }

  /**
   * Gets a Specific Study by ID
   *
   * @summary Get Specific Study by Id
   */
  @Get('/{studyId}')
  @Security('jwt', ['OrganisationAdmin'])
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
  @Security('jwt', ['OrganisationAdmin'])
  @SuccessResponse('201', 'Created')
  @Response<ValidateErrorResponse>('422', 'Validation Failed')
  public async createStudy(@Body() bodyRequest: CreateStudyRequest): Promise<CreateStudyResponse> {
    if ((await this.studyRepo.count({ where: { name: bodyRequest.name, deleted: false } })) > 0) {
      throw new Error('Study with that name already exists')
    }
    const newStudy = await this.studyRepo.create({
      data: { name: bodyRequest.name }, // Note: Study also has email invite info, but this is set via UI
    })
    const responseData = {
      id: newStudy.id,
    }
    logger.info({ ...responseData })
    return responseData
  }

  /**
   * Update an existing study.
   *
   * @summary Update an existing Study
   */
  @Patch('/{studyId}')
  @Response<NotFoundErrorResponse>('404', 'Not Found')
  @Response<ValidateErrorResponse>('422', 'Validation Failed')
  public async updateStudy(
    @Path() studyId: number,
    @Request() request: RequestWithAuthentication,
    @Body() bodyRequest: UpdateStudyRequest,
  ) {
    if (!request.user.studies.includes(studyId)) {
      throw new NotFoundError('Study not found')
    }

    if (
      bodyRequest.name &&
      (await this.studyRepo.count({ where: { name: bodyRequest.name, deleted: false } })) > 0
    ) {
      throw new Error('Study with that name already exists')
    }

    await this.studyRepo.update({
      where: { id: studyId },
      data: bodyRequest,
    })
  }

  @Post('/{studyId}/logo')
  @Response<ValidateErrorResponse>('422', 'Validation Failed')
  public async uploadLogo(
    @UploadedFile() file: Express.Multer.File,
    @Path() studyId: number,
    @Request() request: RequestWithAuthentication,
  ) {
    if (!request.user.studies.includes(studyId)) {
      throw new NotFoundError('Study not found')
    }
    const buffer = await sharp(file.buffer).resize(200).png().toBuffer()
    await prisma.study.update({ where: { id: studyId }, data: { logo: buffer } })
  }

  @Get('/{studyId}/logo')
  @NoSecurity()
  @Response<ValidateErrorResponse>('422', 'Validation Failed')
  public async getLogo(@Path() studyId: number): Promise<Readable> {
    const study = await prisma.study.findFirstOrThrow({
      where: { id: studyId },
      select: { logo: true },
    })

    if (!study.logo) {
      return new SettingsController().getLogo()
    }

    return Readable.from(study.logo as Buffer)
  }

  /**
   * Delete a study
   *
   * @summary Delete a study
   */
  @Delete('/{studyId}')
  @Security('jwt', ['OrganisationAdmin'])
  @Response<NotFoundErrorResponse>('404', 'Not Found')
  public async deleteStudy(@Path() studyId: number) {
    const studyCount = await this.studyRepo.count({})
    if (studyCount == 1) {
      throw new UnprocessableError('Must have at least one study')
    }

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
