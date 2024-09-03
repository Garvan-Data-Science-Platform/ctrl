import {
  Controller,
  Get,
  Post,
  SuccessResponse,
  Response,
  Path,
  Route,
  Tags,
  Body,
  Put,
  Delete,
} from 'tsoa'
import logger from 'common/src/logger'
import prisma from '../PrismaClient'
import { User, type Organisation } from '../../prisma/generated/client'
import { type OrganisationCreationRequest, type OrganisationUpdateRequest } from 'common/src/index'

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

  /**
   * Create a new organisation
   *
   * @summary Create a new Organisation
   */
  @Post('/')
  @SuccessResponse('201', 'Created')
  @Response('500', 'Internal Server Error')
  public async createOrganisation(
    @Body() bodyRequest: OrganisationCreationRequest,
  ): Promise<{ message: string; newOrganisation: Organisation | null }> {
    const { name } = bodyRequest

    // Validation check
    if (!name) {
      const error = { message: 'Missing required fields: name', newOrganisation: null }
      logger.error({ ...error })
      return error
    }

    try {
      const newOrganisation: Organisation = await this.organisationRepo.create({
        data: { name },
      })

      const responseData = { message: 'Created new organisation', newOrganisation }
      logger.info({ ...responseData })
      return responseData
    } catch (err) {
      const error = { message: 'Error creating organisation', newOrganisation: null }
      logger.error({ ...error, err })
      return error
    }
  }

  /**
   * Update an existing organisation
   *
   * @summary Update an existing Organisation
   */
  @Put('/{orgID}')
  @SuccessResponse('200', 'OK')
  @Response('500', 'Internal Server Error')
  @Response('404', 'Not Found')
  public async updateOrganisation(
    @Path() orgID: number,
    @Body() bodyRequest: OrganisationUpdateRequest,
  ): Promise<{
    message: string
    updatedOrganisation: Organisation | null
  }> {
    try {
      const updatedOrganisation = await this.organisationRepo.update({
        where: { id: orgID },
        data: bodyRequest,
      })

      if (!updatedOrganisation) {
        const error = {
          message: `Organisation with ID: ${orgID} not found`,
          updatedOrganisation: null,
        }
        logger.error({ ...error })
        this.setStatus(404)
        return error
      }

      const responseData = {
        message: `Updated organisation with ID: ${orgID}`,
        updatedOrganisation,
      }
      logger.info({ ...responseData })
      return responseData
    } catch (err) {
      const error = { message: 'Error updating organisation', updatedOrganisation: null }
      logger.error({ ...error, err })
      return error
    }
  }

  /**
   * Delete an existing organisation
   *
   * @summary Delete an existing Organisation
   */
  @Delete('/{orgID}')
  @SuccessResponse('200', 'OK')
  @Response('500', 'Internal Server Error')
  @Response('404', 'Not Found')
  public async deleteOrganisation(@Path() orgID: number): Promise<{
    message: string
    deletedOrganisation: Organisation | null
  }> {
    try {
      const deletedOrganisation = await this.organisationRepo.delete({
        where: { id: orgID },
        include: { users: true },
      })

      if (!deletedOrganisation) {
        const error = {
          message: `Organisation with ID: ${orgID} not found`,
          deletedOrganisation: null,
        }
        logger.error({ ...error })
        this.setStatus(404)
        return error
      }

      const responseData = {
        message: `Deleted organisation with ID: ${orgID}`,
        deletedOrganisation,
      }
      logger.info({ ...responseData })
      return responseData
    } catch (err) {
      const error = { message: 'Error deleting organisation', deletedOrganisation: null }
      logger.error({ ...error, err })
      return error
    }
  }

  @Get('/{orgID}/organisations/users')
  @SuccessResponse('200', 'OK')
  @Response('500', 'Internal Server Error')
  @Response('404', 'Not Found')
  public async getOrganisationUsers(@Path() orgID: number): Promise<{
    message: string
    users: User[] | null
  }> {
    try {
      const organisation = await this.organisationRepo.findUnique({
        where: { id: orgID },
        include: { users: true },
      })

      if (!organisation) {
        const error = { message: `Organisation with ID: ${orgID} not found`, users: null }
        logger.error({ ...error })
        this.setStatus(404)
        return error
      }

      const responseData = {
        message: `Got users of organisation with ID: ${orgID}`,
        users: organisation.users,
      }
      logger.info({ ...responseData })
      return responseData
    } catch (err) {
      const error = { message: 'Error getting users of organisation', users: null }
      logger.error({ ...error })
      return error
    }
  }

  @Post('/{orgID}/users/{userID}')
  @SuccessResponse('200', 'OK')
  @Response('500', 'Internal Server Error')
  public async addUserToOrganisation(
    @Path() orgID: number,
    @Path() userID: number,
  ): Promise<{ message: string }> {
    try {
      // Add user to organisation
      await this.organisationRepo.update({
        where: { id: orgID },
        data: { users: { connect: { id: userID } } },
      })
      const responseData = {
        message: `User with ID: ${userID} added to organisation with ID: ${orgID}`,
      }
      logger.info({ ...responseData })
      return responseData
    } catch (err) {
      const error = { message: 'Error adding user to organisation', user: null }
      logger.error({ ...error })
      return error
    }
  }

  @Delete('/{orgID}/users/{userID}')
  @SuccessResponse('200', 'OK')
  @Response('500', 'Internal Server Error')
  public async removeUserFromOrganisation(
    @Path() orgID: number,
    @Path() userID: number,
  ): Promise<{ message: string }> {
    try {
      // Remove user from organisation
      await this.organisationRepo.update({
        where: { id: orgID },
        data: { users: { disconnect: { id: userID } } },
      })
      const responseData = {
        message: `User with ID: ${userID} removed from organisation with ID: ${orgID}`,
      }
      logger.info({ ...responseData })
      return responseData
    } catch (err) {
      const error = { message: 'Error removing user from organisation', user: null }
      logger.error({ ...error })
      return error
    }
  }
}
