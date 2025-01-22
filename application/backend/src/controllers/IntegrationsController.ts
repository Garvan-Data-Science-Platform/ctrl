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

    return await this.processParticipantData(csvData)
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
    params.append('format', 'json')
    params.append('type', 'flat')
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

    return await this.processParticipantData(participantData)
  }

  @Post('/redcap/instrument/upload/csv')
  @Middlewares(upload.single('file'))
  @SuccessResponse('201', 'Upserted Survey from Instrument CSV')
  public async uploadRedcapInstrumentCSV(
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

    return await this.processInstrumentData(csvData, false)
  }

  @Post('/redcap/instrument/upload/api')
  @SuccessResponse('201', 'Created Survey using Redcap API')
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

    return await this.processInstrumentData(surveyData, true)
  }

  private async processParticipantData(rawData: Record<string, string>[]) {
    let data: RegisterParticipantRequest[] = []
    try {
      data = this.integrationService.mapRecordToParticipantRequests(rawData)
    } catch (error) {
      throw new FileUploadError(
        error instanceof Error ? error.message : 'Unknown Error: Failed to Map Data',
      )
    }

    const authController = new AuthController()
    const ids: number[] = []
    let profilesCreatedCount = 0
    let profilesAlreadyExistedCount = 0

    for (const participant of data) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { email, password, middleName, ...participantData } = participant
      const user = await this.userRepo.findFirst({
        where: { email: email },
        select: { id: true, profiles: true },
      })

      if (!user) {
        const participantResponse = await authController.createParticipant(participantData)
        ids.push(participantResponse.id)
        profilesCreatedCount++
      } else {
        if (user.profiles.length === 0) {
          const participantProfile = await prisma.participantProfile.create({
            data: {
              ...participantData,
              user: {
                connect: { id: user.id },
              },
              nextOfKin: participantData.nextOfKin
                ? {
                    create: participantData.nextOfKin,
                  }
                : undefined,
            },
          })
          ids.push(participantProfile.id)
          profilesCreatedCount++
        } else {
          profilesAlreadyExistedCount++
        }
      }
    }

    return { profilesCreatedCount, profilesAlreadyExistedCount, ids }
  }

  private async processInstrumentData(data: Record<string, string>[], isRawData: boolean) {
    let steps: SurveyStep[] = []
    try {
      steps = this.integrationService.mapInstrumentCSVToSurvey(data, isRawData)
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
}
