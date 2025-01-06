import {
  Post,
  Route,
  Tags,
  Security,
  Controller,
  SuccessResponse,
  Response,
  Request,
  Middlewares,
} from 'tsoa'
import { Integrations } from '../../../integrations/src/Integrations'
import exampleREDCapMapping from '../../../integrations/src/exampleREDCapMapping.json'
import prisma from '../PrismaClient'
import { parseCSV } from '../utils/parseCsv'
import { FileUploadError } from '../middlewares/ErrorHandler'
import { Readable } from 'stream'
import * as express from 'express'
import { RegisterParticipantRequest } from 'common/types/api/auth'
import { UnauthorizedErrorResponse, InternalErrorResponse } from 'common/types/api/errors'
import { AuthController } from './AuthController'
import multer from 'multer'
import { SurveyElement } from 'common/types/survey'
const upload = multer({ storage: multer.memoryStorage() })

@Route('integrations')
@Response<UnauthorizedErrorResponse>('401', 'Unauthorized')
@Response<InternalErrorResponse>('500', 'Internal Server Error')
@Tags('Integrations')
@Security('jwt', ['OrganisationAdmin'])
export class IntegrationsController extends Controller {
  userRepo = prisma.user
  profileRepo = prisma.participantProfile
  surveyRepo = prisma.surveyVersion
  spRepo = prisma.surveyParticipant
  integrationService = new Integrations(exampleREDCapMapping)

  @Post('/redcap/participant/upload')
  @Middlewares(upload.single('file'))
  @SuccessResponse('201', 'Created Participants from CSV')
  public async uploadRedcapParticipant(@Request() request: express.Request) {
    const file = await this.validateFile(request)

    // Create a readable stream from the buffer
    const readableStream = Readable.from(file.buffer.toString())
    const csvData: Record<string, string>[] = await parseCSV(readableStream)
    const data: RegisterParticipantRequest[] =
      this.integrationService.mapCSVToParticipantRequests(csvData)

    const participants = []
    const authController: AuthController = new AuthController()
    for (const participant of data) {
      // Since we are not creating a user anymore we don't need all the data from RegisterParticipantRequest, fields may be needed later in dev tho
      // specifically these fields might be required to create a new account for the person and send them an email for it
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { email, password, middleName, ...participantData } = participant
      participants.push(await authController.createParticipant(participantData))
    }
  }

  @Post('/redcap/instrument/upload')
  @Middlewares(upload.single('file'))
  @SuccessResponse('200', 'Created Survey from Instrument CSV')
  public async uploadRedcapInstrument(@Request() request: express.Request) {
    const file = await this.validateFile(request)

    // Create a readable stream from the buffer
    const readableStream = Readable.from(file.buffer.toString())
    const csvData: Record<string, string>[] = await parseCSV(readableStream)

    const elements: SurveyElement[] = this.integrationService.mapInstrumentCSVToSurvey(csvData)
    await this.surveyRepo.create({
      data: {
        status: 'DRAFT',
        versionNumber: 1,
        data: [
          {
            title: 'Imported Survey',
            text: 'Survey Imported from Redcap Instrument',
            elements: elements,
          },
        ],
      },
    })
  }

  private async validateFile(request: express.Request): Promise<Express.Multer.File> {
    const file = request.file

    if (!file) {
      throw new FileUploadError('No file uploaded')
    } else if (!file.buffer || file.buffer.length === 0) {
      throw new FileUploadError('File is empty')
    } else if (file.mimetype !== 'text/csv') {
      throw new FileUploadError('Invalid file type. Please upload a CSV file.')
    }

    return file
  }
}
