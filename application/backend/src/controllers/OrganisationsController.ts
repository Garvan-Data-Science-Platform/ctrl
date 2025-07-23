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
  Middlewares,
} from 'tsoa'
import logger from 'common/src/logger'
import prisma from '../PrismaClient'
import { type Organisation } from '@prisma/client'
import type {
  GetAllOrganisationsResponse,
  GetOrganisationByIdResponse,
  CreateOrganisationRequest,
  CreateOrganisationResponse,
  UpdateOrganisationRequest,
  GetOrganisationUsersResponse,
} from 'common/types/api/organisations'
import {
  InternalErrorResponse,
  NotFoundErrorResponse,
  UnauthorizedErrorResponse,
  UnprocessableErrorResponse,
  ValidateErrorResponse,
} from 'common/types/api/errors'
import { NotFoundError, UnprocessableError } from '../middlewares/ErrorHandler'
import { auditLog } from '../middlewares/AuditLog'

@Route('organisations')
@Tags('Organisations')
@Response<UnauthorizedErrorResponse>('401', 'Unauthorized')
@Response<UnprocessableErrorResponse>('422', 'Unprocessable Content')
@Response<InternalErrorResponse>('500', 'Internal Server Error')
@Security('jwt', ['OrganisationAdmin'])
@Middlewares(auditLog)
export class OrganisationsController extends Controller {
  organisationRepo = prisma.organisation
  userRepo = prisma.user

  /**
   * getAllOrganisations
   *
   * @summary Get all Organisations
   */
  @Get('/')
  public async getAllOrganisations(): Promise<GetAllOrganisationsResponse> {
    const organisations: Organisation[] = await this.organisationRepo.findMany({})
    const responseData = { data: organisations }
    logger.info({ ...responseData })
    return responseData
  }

  /**
   * getOrganisationById
   *
   * @summary Get a specific Organisation
   */
  @Get('/{orgID}')
  @Response<NotFoundErrorResponse>('404', 'Not Found')
  public async getOrganisationById(@Path() orgID: number): Promise<GetOrganisationByIdResponse> {
    const organisation: Organisation | null = await this.organisationRepo.findUnique({
      where: { id: orgID },
    })
    if (!organisation) {
      const errorMessage: string = `Organisation with ID: ${orgID} not found`
      logger.error({ errorMessage })
      throw new NotFoundError(errorMessage)
    }
    const responseData = { data: organisation }
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
  public async createOrganisation(
    @Body() bodyRequest: CreateOrganisationRequest,
  ): Promise<CreateOrganisationResponse> {
    try {
      const newOrganisation: Organisation = await this.organisationRepo.create({
        data: { name: bodyRequest.name },
      })

      const responseData = {
        id: newOrganisation.id,
      }

      logger.info({ ...responseData, newOrganisation })
      return responseData
    } catch (err) {
      const errorMessage: string = 'Error creating organisation'
      logger.error({ errorMessage, err })
      throw new Error(errorMessage)
    }
  }

  /**
   * updateOrganisation
   *
   * @summary Update an existing Organisation
   */
  @Patch('/{orgID}')
  @Response<NotFoundErrorResponse>('404', 'Not Found')
  @Response<ValidateErrorResponse>('422', 'Validation Failed')
  public async updateOrganisation(
    @Path() orgID: number,
    @Body() bodyRequest: UpdateOrganisationRequest,
  ) {
    try {
      await this.organisationRepo.update({
        where: { id: orgID },
        data: bodyRequest,
      })
    } catch (err) {
      const errorMessage: string = `Organisation with ID: ${orgID} not found`
      logger.error({ errorMessage, err })
      throw new NotFoundError(errorMessage)
    }
  }

  /**
   * deleteOrganisation
   *
   * @summary Delete an existing Organisation
   */
  @Delete('/{orgID}')
  @Response<NotFoundErrorResponse>('404', 'Not Found')
  public async deleteOrganisation(@Path() orgID: number) {
    try {
      await this.organisationRepo.delete({
        where: { id: orgID },
        include: { users: true },
      })
    } catch (err) {
      const errorMessage: string = `Organisation with ID: ${orgID} not found`
      logger.error({ errorMessage, err })
      throw new NotFoundError(errorMessage)
    }
  }

  /**
   * getOrganisationUsers
   *
   * @summary Get all Users within a specific Organisation
   */
  @Get('/{orgID}/users')
  @Response<NotFoundErrorResponse>('404', 'Not Found')
  public async getOrganisationUsers(@Path() orgID: number): Promise<GetOrganisationUsersResponse> {
    const organisation = await this.organisationRepo.findUnique({
      where: { id: orgID },
      include: { users: true },
    })

    if (!organisation) {
      const errorMessage: string = `Organisation with ID: ${orgID} not found`
      logger.error({ errorMessage })
      throw new NotFoundError(errorMessage)
    }

    const responseData = {
      data: organisation.users,
    }
    logger.info({ ...responseData })
    return responseData
  }

  /**
   * addUserToOrganisation
   *
   * @summary Add specific User to specific Organisation
   */
  @Post('/{orgID}/users/{userId}')
  @Response<NotFoundErrorResponse>('404', 'Not Found')
  public async addUserToOrganisation(@Path() orgID: number, @Path() userId: number) {
    // Check if user exists
    const user = await this.userRepo.findUnique({ where: { id: userId } })

    if (!user) {
      const errorMessage: string = `User with ID: ${userId} not found`
      logger.error({ errorMessage })
      throw new NotFoundError(errorMessage)
    }

    // Check if organisation exists
    const organisation = await this.organisationRepo.findUnique({ where: { id: orgID } })

    if (!organisation) {
      const errorMessage: string = `Organisation with ID: ${orgID} not found`
      logger.error({ errorMessage })
      throw new NotFoundError(errorMessage)
    }

    // Check if user already in organisation
    const userInOrganisation = await this.organisationRepo.findUnique({
      where: {
        id: orgID,
        users: { some: { id: userId } },
      },
    })

    if (userInOrganisation) {
      const errorMessage: string = `User with ID: ${userId} already in organisation with ID: ${orgID}`
      logger.error({ errorMessage })
      throw new UnprocessableError(errorMessage)
    }

    // Add user to organisation
    await this.organisationRepo.update({
      where: { id: orgID },
      data: { users: { connect: { id: userId } } },
    })
  }

  /**
   * removeUserFromOrganisation
   *
   * @summary Removes a specific User from a specific Organisation
   */
  @Delete('/{orgID}/users/{userId}')
  @Response<NotFoundErrorResponse>('404', 'Not Found')
  public async removeUserFromOrganisation(@Path() orgID: number, @Path() userId: number) {
    // Check if user exists
    const user = await this.userRepo.findUnique({ where: { id: userId } })

    if (!user) {
      const errorMessage: string = `User with ID: ${userId} not found`
      logger.error({ errorMessage })
      throw new NotFoundError(errorMessage)
    }

    // Check if organisation exists
    const organisation = await this.organisationRepo.findUnique({ where: { id: orgID } })

    if (!organisation) {
      const errorMessage: string = `Organisation with ID: ${orgID} not found`
      logger.error({ errorMessage })
      throw new NotFoundError(errorMessage)
    }

    // Check if user is actually in the organisation
    const userInOrganisation = await this.organisationRepo.findUnique({
      where: {
        id: orgID,
        users: { some: { id: userId } },
      },
    })

    if (!userInOrganisation) {
      const errorMessage: string = `User with ID: ${userId} not in organisation with ID: ${orgID}`
      logger.error({ errorMessage })
      throw new UnprocessableError(errorMessage)
    }

    // Remove user from organisation
    await this.organisationRepo.update({
      where: { id: orgID },
      data: { users: { disconnect: { id: userId } } },
    })
  }
}
