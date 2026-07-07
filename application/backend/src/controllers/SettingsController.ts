import prisma from '../PrismaClient'
import {
  UnauthorizedErrorResponse,
  InternalErrorResponse,
  ValidateErrorResponse,
} from 'common/types/api/errors'
import {
  Route,
  Tags,
  Controller,
  Get,
  Delete,
  Response,
  Patch,
  Body,
  Middlewares,
  NoSecurity,
  Post,
  UploadedFile,
  Security,
  ValidateError,
} from 'tsoa'
import { Readable } from 'stream'
import logger from 'common/src/logger'
import type {
  GetSettingsResponse,
  GetUserPortalSettingsResponse,
  UpdateSettingsRequest,
} from 'common/types/api/settings'
import { NotFoundErrorResponse } from 'common/types/api/errors'
import { NotFoundError } from '../middlewares/ErrorHandler'
import { auditLog } from '../middlewares/AuditLog'
import { processLogoImage } from 'common/src/imageHelpers'
import { urlRegex } from 'common/src/regex'
import { sanitizeUrl } from '@braintree/sanitize-url'

function sanitiseAndValidateUrl(link: string) {
  const validatedUrl = sanitizeUrl(link)
  if (urlRegex.test(validatedUrl)) {
    return validatedUrl
  } else {
    throw new Error('urlRegex failed')
  }
}

@Route('settings')
@Tags('Settings')
@Response<UnauthorizedErrorResponse>('401', 'Unauthorized')
@Response<InternalErrorResponse>('500', 'Internal Server Error')
@Middlewares(auditLog)
export class SettingsController extends Controller {
  /**
   * Get the current organisation
   *
   * @summary Get the current organisation settings
   */
  @Get('/')
  @Security('jwt', ['OrganisationAdmin'])
  public async getSettings(): Promise<GetSettingsResponse> {
    const orgdata = await prisma.organisation.findFirstOrThrow({
      where: { id: 1 },
      select: {
        logo: true,
        primaryColour: true,
        secondaryColour: true,
        tcLink: true,
        newsLink: true,
      },
    })

    // logoSet is used by admin client to determine if a logo is set on page load
    // returns 'present' or null rather than sending whole logo in payload
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { logo: _logo, ...settingsWithoutLogo } = orgdata
    return {
      data: {
        ...settingsWithoutLogo,
        logoSet: orgdata.logo ? 'present' : null,
      },
    }
  }

  @Patch('/')
  @Security('jwt', ['OrganisationAdmin'])
  @Response<ValidateErrorResponse>('422', 'Validation Failed')
  public async updateSettings(@Body() bodyRequest: UpdateSettingsRequest) {
    const data = bodyRequest
    // There is already validation on Admin Portal UI but best to not store unsanitized data
    Object.keys(data)
      .filter((urlKey) => urlKey === 'newsLink' || urlKey === 'tcLink')
      .forEach((key) => {
        try {
          data[key] = sanitiseAndValidateUrl(data[key] as string)
        } catch (err) {
          const errorMessage: string = `Link is not acceptable URL: ${data.newsLink}`
          logger.error({ errorMessage, err })
          throw new ValidateError({}, errorMessage)
        }
      })

    await prisma.organisation.update({ where: { id: 1 }, data: data })
  }

  @Get('/userportal')
  @NoSecurity()
  public async getTheme(): Promise<GetUserPortalSettingsResponse> {
    const themedata = await prisma.organisation.findFirstOrThrow({
      where: { id: 1 },
      select: {
        primaryColour: true,
        secondaryColour: true,
        newsLink: true,
      },
    })
    return { data: themedata }
  }

  @Post('/logo')
  @Security('jwt', ['OrganisationAdmin'])
  @Response<ValidateErrorResponse>('422', 'Validation Failed')
  public async uploadLogo(@UploadedFile() file: Express.Multer.File) {
    const buffer = await processLogoImage(file.buffer)
    await prisma.organisation.update({ where: { id: 1 }, data: { logo: buffer } })
  }

  @Get('/logo')
  @NoSecurity()
  @Response<ValidateErrorResponse>('422', 'Validation Failed')
  @Response<NotFoundErrorResponse>('404', 'Not Found')
  public async getLogo(): Promise<Readable> {
    const org = await prisma.organisation.findFirstOrThrow({
      where: { id: 1 },
      select: { logo: true },
    })

    if (!org.logo) {
      throw new NotFoundError('Org logo not found')
    }

    return Readable.from(org.logo as Buffer)
  }

  @Delete('/logo')
  @Security('jwt', ['OrganisationAdmin'])
  @Response('204', 'Logo deleted')
  @Response<NotFoundErrorResponse>('404', 'Not Found')
  public async deleteLogo(): Promise<void> {
    const org = await prisma.organisation.findUnique({
      where: { id: 1 },
      select: { logo: true },
    })

    if (!org || !org.logo) {
      throw new NotFoundError('Logo not found')
    }

    await prisma.organisation.update({
      where: { id: 1 },
      data: { logo: null },
    })
  }
}
