import logger from 'common/src/logger'
import prisma from '../PrismaClient'
import {
  UnauthorizedErrorResponse,
  InternalErrorResponse,
  NotFoundErrorResponse,
  ValidateErrorResponse,
} from 'common/types/api/errors'
import type { GetParticipantProfileResponse, UpdateProfileRequest } from 'common/types/api/users'
import { NotFoundError } from '../middlewares/ErrorHandler'
import {
  Route,
  Tags,
  Security,
  Controller,
  Get,
  Path,
  Response,
  Request,
  Patch,
  Body,
  Middlewares,
  NoSecurity,
} from 'tsoa'
import * as express from 'express'
import type {
  GetSettingsResponse,
  GetThemeResponse,
  UpdateSettingsRequest,
} from 'common/types/api/settings'
import { FamilyMember } from 'common/types/api/users/getParticipantProfile'
import { auditLog } from '../middlewares/AuditLog'
import { recalculateAnswers } from '../utils/answers'

@Route('settings')
@Tags('Settings')
@Response<UnauthorizedErrorResponse>('401', 'Unauthorized')
@Response<InternalErrorResponse>('500', 'Internal Server Error')
@Middlewares(auditLog)
export class SettingsController extends Controller {
  /**
   * Get the current Participants Profile
   *
   * @summary Get the current Participants Profile
   */
  @Get('/')
  public async getSettings(): Promise<GetSettingsResponse> {
    const orgdata = await prisma.organisation.findFirstOrThrow({
      where: { id: 1 },
      select: {
        mailerHost: true,
        mailerPassword: true,
        mailerPort: true,
        mailerUser: true,
        primaryColour: true,
        secondaryColour: true,
        redcapToken: true,
        redcapURL: true,
      },
    })
    return { data: orgdata }
  }

  @Patch('/')
  @Response<ValidateErrorResponse>('422', 'Validation Failed')
  public async updateSettings(@Body() bodyRequest: UpdateSettingsRequest) {
    await prisma.organisation.update({ where: { id: 1 }, data: bodyRequest })
  }

  @Get('/theme')
  @NoSecurity()
  public async getTheme(): Promise<GetThemeResponse> {
    const themedata = await prisma.organisation.findFirstOrThrow({
      where: { id: 1 },
      select: {
        primaryColour: true,
        secondaryColour: true,
      },
    })
    return { data: themedata }
  }
}
