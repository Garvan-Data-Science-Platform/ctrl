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
import prisma from '../PrismaClient'
import { Readable } from 'stream'
import * as express from 'express'
import multer from 'multer'
import { RegisterParticipantRequest } from 'common/types/api/auth'
import {
  UploadRedcapInstrumentResponse,
  UploadRedcapParticipantResponse,
} from 'common/types/api/integrations/redcap'
import { UnauthorizedErrorResponse, InternalErrorResponse } from 'common/types/api/errors'
import { SurveyElement, SurveyStep } from 'common/types/survey'
import exampleREDCapMapping from '../../../integrations/src/exampleREDCapMapping.json'
import { parseCSV, validateFile } from '../utils/parseCsv'
import { AuthController } from './AuthController'
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
  public async uploadRedcapParticipant(
    @Request() request: express.Request,
  ): Promise<UploadRedcapParticipantResponse> {
    const file = await validateFile(request)

    // Create a readable stream from the buffer
    const readableStream = Readable.from(file.buffer.toString())
    const csvData: Record<string, string>[] = await parseCSV(readableStream)
    const data: RegisterParticipantRequest[] =
      this.integrationService.mapCSVToParticipantRequests(csvData)

    const participants = []
    const ids = []
    const authController: AuthController = new AuthController()
    for (const participant of data) {
      // Since we are not creating a user anymore we don't need all the data from RegisterParticipantRequest, fields may be needed later in dev tho
      // specifically these fields might be required to create a new account for the person and send them an email for it
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { email, password, middleName, ...participantData } = participant
      const addedParticipant = participants.push(
        await authController.createParticipant(participantData),
      )
      ids.push(addedParticipant)
    }
    return { ids: ids }
  }

  @Post('/redcap/instrument/upload')
  @Middlewares(upload.single('file'))
  @SuccessResponse('200', 'Upserted Survey from Instrument CSV')
  public async uploadRedcapInstrument(
    @Request() request: express.Request,
  ): Promise<UploadRedcapInstrumentResponse> {
    const file = await validateFile(request)

    // Create a readable stream from the buffer
    const readableStream = Readable.from(file.buffer.toString())
    const csvData: Record<string, string>[] = await parseCSV(readableStream)

    const elements: SurveyElement[] = this.integrationService.mapInstrumentCSVToSurvey(csvData)
    const steps: SurveyStep[] = [
      {
        title: 'Imported Survey',
        text: 'Survey Imported from Redcap Instrument',
        elements: elements,
      },
    ]

    // Check if a draft survey already exists
    const existingSurvey = await this.surveyRepo.findFirst({
      where: { status: 'DRAFT' },
    })

    let survey
    if (existingSurvey) {
      // Update the existing survey
      survey = await this.surveyRepo.update({
        where: { id: existingSurvey.id },
        data: {
          versionNumber: existingSurvey.versionNumber + 1,
          data: steps,
        },
      })
    } else {
      // Create a new survey
      survey = await this.surveyRepo.create({
        data: {
          status: 'DRAFT',
          versionNumber: 1,
          data: steps,
        },
      })
    }

    return { id: survey.id }
  }
}
