import { Controller, Get, SuccessResponse, Response, Path, Route, Tags } from 'tsoa'
import logger from 'common/src/logger'
import prisma from '../PrismaClient'
import { Organisation } from '../../prisma/generated/client'

@Route('organisations')
@Tags('Organisations')
export class OrganisationsController extends Controller {
  organisationRepo = prisma.organisation

  /**
   * getAllOrganisations
   *
   * @summary Get all Organisations
   */
  @Get('/')
  @SuccessResponse('200', 'OK')
  @Response('500', 'Internal Server Error')
  public async getAllOrganisations(): Promise<{ message: string; organisations: Organisation[] }> {
    const organisations: Organisation[] = await this.organisationRepo.findMany({})
    const responseData = { message: 'Got all organisations', organisations }
    logger.info({ ...responseData })
    return responseData
  }

  /**
   * getOrganisationById
   *
   * @summary Get a specific Organisation
   */
  @Get('/{orgID}')
  @SuccessResponse('200', 'OK')
  @Response('500', 'Internal Server Error')
  @Response('404', 'Not Found')
  public async getOrganisationById(
    @Path() orgID: number,
  ): Promise<{ message: string; organisation: Organisation | null }> {
    const organisation: Organisation | null = await this.organisationRepo.findUnique({
      where: { id: orgID },
    })
    if (!organisation) {
      const error = { message: `Organisation with ID: ${orgID} not found`, organisation }
      logger.error({ ...error })
      this.setStatus(404)
      return error
    }
    const responseData = { message: `Get organisation with ID: ${orgID}`, organisation }
    logger.info({ ...responseData })
    return responseData
  }
}
