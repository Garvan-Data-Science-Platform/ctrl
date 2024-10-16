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
  Patch,
  Delete,
  Security,
} from 'tsoa'
import logger from 'common/src/logger'
import prisma from '../PrismaClient'
import { type Organisation, Prisma } from '@prisma/client'
import type {
  GetAllOrganisationsResponse,
  GetOrganisationByIdResponse,
  CreateOrganisationRequest,
  CreateOrganisationResponse,
  UpdateOrganisationRequest,
  UpdateOrganisationResponse,
  DeleteOrganisationResponse,
  AddUserToOrganisationResponse,
  RemoveUserFromOrganisationResponse,
  GetOrganisationUsersResponse,
} from 'common/types/api/organisations'

@Route('organisations')
@Tags('Organisations')
@Security('jwt')
@Response('401', 'Unauthorized')
export class OrganisationsController extends Controller {
  organisationRepo = prisma.organisation
  userRepo = prisma.user

  /**
   * getAllOrganisations
   *
   * @summary Get all Organisations
   */
  @Get('/')
  @SuccessResponse('200', 'OK')
  @Response('500', 'Internal Server Error')
  public async getAllOrganisations(): Promise<GetAllOrganisationsResponse> {
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
  public async getOrganisationById(@Path() orgID: number): Promise<GetOrganisationByIdResponse> {
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
   * createOrganisation
   *
   * @summary Create a new Organisation
   */
  @Post('/')
  @SuccessResponse('201', 'Created')
  @Response('500', 'Internal Server Error')
  public async createOrganisation(
    @Body() bodyRequest: CreateOrganisationRequest,
  ): Promise<CreateOrganisationResponse> {
    try {
      const newOrganisation: Organisation = await this.organisationRepo.create({
        data: { name: bodyRequest.name },
      })

      const responseData = { message: 'Created new organisation' }
      logger.info({ ...responseData, newOrganisation })
      return responseData
    } catch (err) {
      const error = { message: 'Error creating organisation' }
      logger.error({ ...error, err })
      return error
    }
  }

  /**
   * updateOrganisation
   *
   * @summary Update an existing Organisation
   */
  @Patch('/{orgID}')
  @SuccessResponse('200', 'OK')
  @Response('500', 'Internal Server Error')
  @Response('404', 'Not Found')
  public async updateOrganisation(
    @Path() orgID: number,
    @Body() bodyRequest: UpdateOrganisationRequest,
  ): Promise<UpdateOrganisationResponse> {
    try {
      const updatedOrganisation = await this.organisationRepo.update({
        where: { id: orgID },
        data: bodyRequest,
      })
      if (!updatedOrganisation) {
        const error = {
          message: `Organisation with ID: ${orgID} not found`,
        }
        logger.error({ ...error })
        this.setStatus(404)
        return error
      }

      const responseData = {
        message: `Updated organisation with ID: ${orgID}`,
      }
      logger.info({ ...responseData, updatedOrganisation })
      return responseData
    } catch (err) {
      const error = { message: 'Error updating organisation' }
      logger.error({ ...error, err })
      return error
    }
  }

  /**
   * deleteOrganisation
   *
   * @summary Delete an existing Organisation
   */
  @Delete('/{orgID}')
  @SuccessResponse('200', 'OK')
  @Response('500', 'Internal Server Error')
  @Response('404', 'Not Found')
  public async deleteOrganisation(@Path() orgID: number): Promise<DeleteOrganisationResponse> {
    try {
      const deletedOrganisation = await this.organisationRepo.delete({
        where: { id: orgID },
        include: { users: true },
      })
      if (!deletedOrganisation) {
        const error = {
          message: `Organisation with ID: ${orgID} not found`,
        }
        logger.error({ ...error })
        this.setStatus(404)
        return error
      }

      const responseData = {
        message: `Deleted organisation with ID: ${orgID}`,
      }
      logger.info({ ...responseData, deletedOrganisation })
      return responseData
    } catch (err) {
      const error = { message: 'Error deleting organisation' }
      logger.error({ ...error, err })
      return error
    }
  }

  /**
   * getOrganisationUsers
   *
   * @summary Get all Users within a specific Organisation
   */
  @Get('/{orgID}/users')
  @SuccessResponse('200', 'OK')
  @Response('500', 'Internal Server Error')
  @Response('404', 'Not Found')
  public async getOrganisationUsers(@Path() orgID: number): Promise<GetOrganisationUsersResponse> {
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

  /**
   * addUserToOrganisation
   *
   * @summary Add specific User to specific Organisation
   */
  @Post('/{orgID}/users/{userID}')
  @SuccessResponse('200', 'OK')
  @Response('500', 'Internal Server Error')
  @Response('404', 'Not Found')
  public async addUserToOrganisation(
    @Path() orgID: number,
    @Path() userID: number,
  ): Promise<AddUserToOrganisationResponse> {
    try {
      // Check if user exists
      const user = await this.userRepo.findUnique({ where: { id: userID } })

      if (!user) {
        const error = { message: `User with ID: ${userID} not found` }
        logger.error({ ...error })
        this.setStatus(404)
        return error
      }

      // Check if organisation exists
      const organisation = await this.organisationRepo.findUnique({ where: { id: orgID } })

      if (!organisation) {
        const error = { message: `Organisation with ID: ${orgID} not found` }
        logger.error({ ...error })
        this.setStatus(404)
        return error
      }

      // Check if user already in organisation
      const userInOrganisation = await this.organisationRepo.findUnique({
        where: {
          id: orgID,
          users: { some: { id: userID } },
        },
      })

      if (userInOrganisation) {
        const error = {
          message: `User with ID: ${userID} already in organisation with ID: ${orgID}`,
        }
        logger.error({ ...error })
        return error
      }

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
      const error = { message: 'Error adding user to organisation' }
      logger.error({ ...error })
      return error
    }
  }

  /**
   * removeUserFromOrganisation
   *
   * @summary Removes a specific User from a specific Organisation
   */
  @Delete('/{orgID}/users/{userID}')
  @SuccessResponse('200', 'OK')
  @Response('500', 'Internal Server Error')
  @Response('404', 'Not Found')
  public async removeUserFromOrganisation(
    @Path() orgID: number,
    @Path() userID: number,
  ): Promise<RemoveUserFromOrganisationResponse> {
    try {
      // Check if user exists
      const user = await this.userRepo.findUnique({ where: { id: userID } })

      if (!user) {
        const error = { message: `User with ID: ${userID} not found` }
        logger.error({ ...error })
        this.setStatus(404)
        return error
      }

      // Check if organisation exists
      const organisation = await this.organisationRepo.findUnique({ where: { id: orgID } })

      if (!organisation) {
        const error = { message: `Organisation with ID: ${orgID} not found` }
        logger.error({ ...error })
        this.setStatus(404)
        return error
      }

      // Check if user is actually in the organisation
      const userInOrganisation = await this.organisationRepo.findUnique({
        where: {
          id: orgID,
          users: { some: { id: userID } },
        },
      })

      if (!userInOrganisation) {
        const error = {
          message: `User with ID: ${userID} not in organisation with ID: ${orgID}`,
        }
        logger.error({ ...error })
        return error
      }

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
      const error = { message: 'Error removing user from organisation' }
      logger.error({ ...error })
      return error
    }
  }
}
