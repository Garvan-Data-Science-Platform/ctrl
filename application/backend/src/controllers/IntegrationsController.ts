import {
  Post,
  Route,
  Tags,
  Security,
  Controller,
  Response,
  SuccessResponse,
  Body,
  UploadedFile,
  Middlewares,
} from 'tsoa'
import { Integrations } from '../../../integrations/src/Integrations'
import prisma from '../PrismaClient'
import { Readable } from 'stream'
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
import logger from 'common/src/logger'
import { AuthController } from './AuthController'
import { auditLog } from '../middlewares/AuditLog'

@Route('integrations')
@Response<UnauthorizedErrorResponse>('401', 'Unauthorized')
@Response<InternalErrorResponse>('500', 'Internal Server Error')
@Tags('Integrations')
@Security('jwt', ['OrganisationAdmin'])
@Middlewares(auditLog)
export class IntegrationsController extends Controller {
  userRepo = prisma.user
  profileRepo = prisma.participantProfile
  surveyRepo = prisma.surveyVersion
  spRepo = prisma.surveyParticipant
  integrationService = new Integrations(exampleREDCapMapping)
  REDCAP_API_URL: string = ''

  @Post('/redcap/participant/upload/csv')
  @SuccessResponse('201', 'Created Participants from CSV')
  public async uploadRedcapParticipantCSV(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadRedcapParticipantResponse> {
    logger.info({ message: 'This is the file that has been uploaded', file })
    await validateFile(file, []) // no required headers here so we pass none to the headers checker
    // Create a readable stream from the buffer
    const readableStream = Readable.from(file.buffer.toString())
    const csvData: Record<string, string>[] = await parseCSV(readableStream)

    return await this.processParticipantData(csvData)
  }

  @Post('/redcap/participant/upload/api')
  @SuccessResponse('201', 'Created Participants from REDCap API')
  public async uploadRedcapParticipantAPI(
    @Body() bodyRequest: UploadRedcapParticipantAPIRequest,
  ): Promise<UploadRedcapParticipantResponse> {
    this.REDCAP_API_URL = this.validateRedcapConfig()
    const { formName, redcapAPIToken } = bodyRequest
    const params = new URLSearchParams()
    params.append('token', redcapAPIToken || (process.env.REDCAP_API_TOKEN as string))
    params.append('content', 'record')
    params.append('format', 'json')
    /**
     * flat - output as one record per row [default]
     */
    params.append('type', 'flat')

    /**
     * an array of form names you wish to pull records for.
     * If the form name has a space in it, replace the space
     * with an underscore
     * (by default, all records from all data collection instruments is pulled)
     */
    params.append('form[0]', formName)

    const participantData = await fetch(this.REDCAP_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          throw new BadGatewayError('Error communicating with REDCap API')
        }
        return data
      })
      .catch((error) => {
        throw new BadGatewayError('Error communicating with REDCap API', error)
      })

    return await this.processParticipantData(participantData)
  }

  @Post('/redcap/instrument/upload/csv')
  @SuccessResponse('201', 'Upserted Survey from Instrument CSV')
  public async uploadRedcapInstrumentCSV(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadRedcapInstrumentResponse> {
    await validateFile(file, [
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
  @SuccessResponse('201', 'Created Survey from Redcap API')
  public async uploadRedcapInstrumentAPI(
    @Body() bodyRequest: UploadRedcapInstrumentAPIRequest,
  ): Promise<UploadRedcapInstrumentResponse> {
    this.REDCAP_API_URL = this.validateRedcapConfig()
    const { formName, redcapAPIToken } = bodyRequest
    const params = new URLSearchParams()
    params.append('token', redcapAPIToken || (process.env.REDCAP_API_TOKEN as string))
    params.append('content', 'metadata')
    params.append('format', 'json')

    /**
     * an array of form names specifying specific data collection instruments
     * for which you wish to pull metadata (by default, all metadata is pulled).
     *
     * NOTE: These 'forms' are not the form label values that are seen on the webpages,
     * but instead they are the unique form names seen in Column B of the data dictionary.
     */
    params.append('forms[0]', formName)

    const surveyData = await fetch(this.REDCAP_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })
      .then((response) => {
        return response.json()
      })
      .then((data) => {
        if (data.error) {
          throw new BadGatewayError('Error communicating with REDCap API')
        }
        return data
      })
      .catch((error) => {
        throw new BadGatewayError('Error communicating with REDCap API', error)
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

      // If user doesn't exist, create a participant using the authController, otherwise create a profile and attact it to the user.
      if (!user) {
        try {
          const participantResponse = await authController.createParticipant(participantData)
          ids.push(participantResponse.id)
          profilesCreatedCount++
        } catch (err) {
          logger.error(err)
          profilesAlreadyExistedCount++
          continue
        }
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

  private validateRedcapConfig() {
    if (!process.env.REDCAP_API_URL) {
      throw new BadGatewayError('Redcap API not configured: missing REDCAP_API_URL')
    }
    return process.env.REDCAP_API_URL
  }
}
