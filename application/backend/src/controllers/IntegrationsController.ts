import {
  Post,
  Route,
  Tags,
  Security,
  Controller,
  Response,
  Request,
  Middlewares,
  SuccessResponse,
  Body,
} from 'tsoa'
import { Integrations } from '../../../integrations/src/Integrations'
import prisma from '../PrismaClient'
import { Readable } from 'stream'
import * as express from 'express'
import multer from 'multer'
import { RegisterParticipantRequest } from 'common/types/api/auth'
import type {
  UploadRedcapInstrumentResponse,
  UploadRedcapInstrumentAPIRequest,
  UploadRedcapParticipantResponse,
  UploadRedcapParticipantAPIRequest,
} from 'common/types/api/integrations/redcap'
import { BadGatewayError } from '../middlewares/ErrorHandler'
import { UnauthorizedErrorResponse, InternalErrorResponse } from 'common/types/api/errors'
import { SurveyStep } from 'common/types/survey'
import exampleREDCapMapping from '../../../integrations/src/exampleREDCapMapping.json'
import { parseCSV, validateFile } from '../utils/parseCsv'
import { FileUploadError } from '../middlewares/ErrorHandler'
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

  @Post('/redcap/participant/upload/csv')
  @Middlewares(upload.single('file'))
  @SuccessResponse('201', 'Created Participants from CSV')
  public async uploadRedcapParticipantCSV(
    @Request() request: express.Request,
  ): Promise<UploadRedcapParticipantResponse> {
    const file = await validateFile(request, []) // no required headers here so we pass none to the headers checker
    // Create a readable stream from the buffer
    const readableStream = Readable.from(file.buffer.toString())
    const csvData: Record<string, string>[] = await parseCSV(readableStream)

    // fetches data from mapping
    let data: RegisterParticipantRequest[] = []
    try {
      data = this.integrationService.mapRecordToParticipantRequests(csvData)
    } catch (error) {
      throw new FileUploadError(
        error instanceof Error ? error.message : 'Unknown Error: Failed to Map Data',
      )
    }

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

  @Post('/redcap/instrument/upload/csv')
  @Middlewares(upload.single('file'))
  @SuccessResponse('200', 'Upserted Survey from Instrument CSV')
  public async uploadRedcapInstrument(
    @Request() request: express.Request,
  ): Promise<UploadRedcapInstrumentResponse> {
    const file = await validateFile(request, [
      '"Field Type"',
      '"Field Label"',
      '"Section Header"',
      '"Choices, Calculations, OR Slider Labels"',
    ]) // list required fields

    // Create a readable stream from the buffer
    const readableStream = Readable.from(file.buffer.toString())
    const csvData: Record<string, string>[] = await parseCSV(readableStream)

    // fetches elements from mapping
    let steps: SurveyStep[] = []
    try {
      steps = this.integrationService.mapInstrumentCSVToSurvey(csvData, false)
    } catch (error) {
      throw new FileUploadError(
        error instanceof Error ? error.message : 'Unknown Error: Failed to Map Data',
      )
    }

    const existingSurvey = await this.surveyRepo.findFirst({
      where: { status: 'DRAFT' },
    })

    // prisma doesn't let you use where to find a non-unique id here so we have to use find first in the previous ine
    const survey = await this.surveyRepo.upsert({
      where: { id: existingSurvey ? existingSurvey.id : -1 }, // Use a non-existent id for creation
      update: {
        versionNumber: { increment: 1 },
        data: steps,
      },
      create: {
        status: 'DRAFT',
        versionNumber: 1,
        data: steps,
      },
    })

    return { id: survey.id }
  }

  @Post('/redcap/participant/upload/api')
  @SuccessResponse('201', 'Created Participants from CSV')
  public async uploadRedcapParticipantAPI(
    @Body() bodyRequest: UploadRedcapParticipantAPIRequest,
  ): Promise<UploadRedcapParticipantResponse> {
    const { form } = bodyRequest
    const params = new URLSearchParams()
    params.append('token', '012745DC3FC14683910C3CCF233DD616')
    params.append('content', 'record')
    params.append('action', 'export')
    params.append('format', 'json')
    params.append('type', 'flat')
    params.append('returnFormat', 'json')
    params.append('form[0]', form)

    const participantData = await fetch('https://redcap.gimr.garvan.org.au/api/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })
      .then((response) => response.json())
      .then((data) => {
        return data
      })
      .catch(() => {
        throw new BadGatewayError('Error communicating with REDCap API')
      })

    const data: RegisterParticipantRequest[] =
      this.integrationService.mapRecordToParticipantRequests(participantData)

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

  @Post('/redcap/instrument/upload/api')
  @SuccessResponse('200', 'Created Survey using Redcap API')
  public async uploadRedcapInstrumentAPI(
    @Body() bodyRequest: UploadRedcapInstrumentAPIRequest,
  ): Promise<UploadRedcapInstrumentResponse> {
    const { form } = bodyRequest
    const params = new URLSearchParams()
    params.append('token', '012745DC3FC14683910C3CCF233DD616')
    params.append('content', 'metadata')
    params.append('format', 'json')
    params.append('forms[0]', form)

    const surveyData = await fetch('https://redcap.gimr.garvan.org.au/api/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })
      .then((response) => response.json())
      .then((data) => {
        return data
      })
      .catch(() => {
        throw new BadGatewayError('Error communicating with REDCap API')
      })

    const steps: SurveyStep[] = this.integrationService.mapInstrumentCSVToSurvey(
      surveyData,
      true, // rawData flag - true since the api takes raw data
    )

    const survey = await this.surveyRepo.create({
      data: {
        status: 'DRAFT',
        versionNumber: 1,
        data: steps,
      },
    })

    return { id: survey.id }
  }
}
