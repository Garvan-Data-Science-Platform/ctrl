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
  Response,
  Patch,
  Body,
  Middlewares,
  NoSecurity,
  Post,
  UploadedFile,
  Security,
} from 'tsoa'
import { Readable } from 'stream'
import type {
  GetSettingsResponse,
  GetThemeResponse,
  UpdateSettingsRequest,
} from 'common/types/api/settings'
import { auditLog } from '../middlewares/AuditLog'
import sharp from 'sharp'

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
        mailerHost: true,
        mailerPassword: true,
        mailerPort: true,
        mailerUser: true,
        primaryColour: true,
        secondaryColour: true,
        redcapToken: true,
        redcapURL: true,
        tcLink: true,
      },
    })
    return { data: orgdata }
  }

  @Patch('/')
  @Security('jwt', ['OrganisationAdmin'])
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

  @Post('/logo')
  @Security('jwt', ['OrganisationAdmin'])
  @Response<ValidateErrorResponse>('422', 'Validation Failed')
  public async uploadLogo(@UploadedFile() file: Express.Multer.File) {
    const buffer = await sharp(file.buffer).resize(200).png().toBuffer()
    await prisma.organisation.update({ where: { id: 1 }, data: { logo: buffer } })
  }

  @Get('/logo')
  @NoSecurity()
  @Response<ValidateErrorResponse>('422', 'Validation Failed')
  public async getLogo(): Promise<Readable> {
    const org = await prisma.organisation.findFirstOrThrow({
      where: { id: 1 },
      select: { logo: true },
    })

    if (!org.logo) {
      const blankLogo = await sharp({
        create: { width: 200, height: 100, channels: 3, background: { r: 255, g: 255, b: 255 } },
      })
        .png()
        .toBuffer()
      return Readable.from(blankLogo)
    }

    return Readable.from(org.logo as Buffer)
  }
}
