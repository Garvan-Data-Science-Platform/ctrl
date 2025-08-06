import {
  Post,
  Path,
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
import { BadGatewayError, UnprocessableError } from '../middlewares/ErrorHandler'
import {
  UnauthorizedErrorResponse,
  InternalErrorResponse,
  UnprocessableErrorResponse,
} from 'common/types/api/errors'
import { SurveyStep } from 'common/types/survey'
import REDCapMapping from '../../../integrations/src/REDCapMapping.json'
import { parseCSV, validateFile } from '../utils/parseCsv'
import { FileUploadError } from '../middlewares/ErrorHandler'
import logger from 'common/src/logger'
import { AuthController } from './AuthController'
import { auditLog } from '../middlewares/AuditLog'

@Route('studies/{studyId}/integrations')
@Response<UnauthorizedErrorResponse>('401', 'Unauthorized')
@Response<InternalErrorResponse>('500', 'Internal Server Error')
@Response<UnprocessableErrorResponse>('422', 'Unprocessable Content')
@Tags('Integrations')
@Security('jwt', ['OrganisationAdmin'])
@Middlewares(auditLog)
export class IntegrationsController extends Controller {
  userRepo = prisma.user
  profileRepo = prisma.participantProfile
  surveyRepo = prisma.surveyVersion
  svaRepo = prisma.surveyVersionAnswers
  integrationService = new Integrations(REDCapMapping)

  @Post('/redcap/participant/upload/csv')
  @SuccessResponse('201', 'Created Participants from CSV')
  public async uploadRedcapParticipantCSV(
    @Path() studyId: number,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadRedcapParticipantResponse> {
    logger.info({ message: 'This is the file that has been uploaded', file })
    await validateFile(file, []) // no required headers here so we pass none to the headers checker
    // Create a readable stream from the buffer
    const readableStream = Readable.from(file.buffer.toString())
    const csvData: Record<string, string>[] = await parseCSV(readableStream)

    return await this.processParticipantData(studyId, csvData)
  }

  @Post('/redcap/participant/upload/api')
  @SuccessResponse('201', 'Created Participants from REDCap API')
  public async uploadRedcapParticipantAPI(
    @Path() studyId: number,
    @Body() bodyRequest: UploadRedcapParticipantAPIRequest,
  ): Promise<UploadRedcapParticipantResponse> {
    const { formName } = bodyRequest
    const params = new URLSearchParams()

    const redcapSettings = await prisma.organisation.findFirstOrThrow({
      where: { id: 1 },
      select: { redcapToken: true, redcapURL: true },
    })

    if (!redcapSettings.redcapToken || !redcapSettings.redcapURL) {
      throw new UnprocessableError('Redcap API not configured')
    }

    params.append('token', redcapSettings.redcapToken)
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

    const participantData = await fetch(redcapSettings.redcapURL, {
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

    return await this.processParticipantData(studyId, participantData)
  }

  @Post('/redcap/instrument/upload/csv')
  @SuccessResponse('201', 'Upserted Survey from Instrument CSV')
  public async uploadRedcapInstrumentCSV(
    @Path() studyId: number,
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

    return await this.processInstrumentData(studyId, csvData, false)
  }

  @Post('/redcap/instrument/upload/api')
  @SuccessResponse('201', 'Created Survey from Redcap API')
  public async uploadRedcapInstrumentAPI(
    @Path() studyId: number,
    @Body() bodyRequest: UploadRedcapInstrumentAPIRequest,
  ): Promise<UploadRedcapInstrumentResponse> {
    const { formName } = bodyRequest

    const redcapSettings = await this.getRedcapConfig()

    const params = new URLSearchParams()
    params.append('token', redcapSettings.redcapToken)
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

    const surveyData = await fetch(redcapSettings.redcapURL, {
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
        if (!this.allFormNamesMatch(data, formName)) {
          throw new BadGatewayError('Invalid form name provided to REDCap API')
        }
        return data
      })
      .catch((error) => {
        throw new BadGatewayError(error.message, error)
      })
    return await this.processInstrumentData(studyId, surveyData, true)
  }

  private async processParticipantData(studyId: number, rawData: Record<string, string>[]) {
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
    const newInvites: string[] = []

    for (const participant of data) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { email, password, middleName, ...participantData } = participant
      newInvites.push(email)
      const user = await this.userRepo.findFirst({
        where: { email: email },
        select: { id: true, profiles: true },
      })

      // If user doesn't exist, create a participant using the authController and send an invitation, otherwise create a profile and attach it to the user.
      if (!user) {
        try {
          const participantResponse = await authController.createParticipant(
            participantData,
            studyId,
          )
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
              studies: {
                create: {
                  study: {
                    connect: {
                      id: studyId,
                    },
                  },
                },
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

    return { profilesCreatedCount, profilesAlreadyExistedCount, ids, newInvites }
  }

  private async processInstrumentData(
    studyId: number,
    data: Record<string, string>[],
    isRawData: boolean,
  ) {
    let steps: SurveyStep[] = []
    try {
      steps = this.integrationService.mapInstrumentCSVToSurvey(data, isRawData)
    } catch (error) {
      throw new FileUploadError(
        error instanceof Error ? error.message : 'Unknown Error: Failed to Map Data',
      )
    }

    const existingSurvey = await this.surveyRepo.findFirst({
      where: { status: 'DRAFT', studyId: studyId },
    })

    // prisma doesn't let you use where to find a non-unique id here so we have to use find first in the previous ine
    const survey = await this.surveyRepo.upsert({
      where: { id: existingSurvey ? existingSurvey.id : -1 }, // TODO: check that survey gets created before REDCAP integration is allowed
      update: {
        data: steps,
      },
      create: {
        status: 'DRAFT',
        data: steps,
        studyId: studyId,
        versionNumber: existingSurvey ? existingSurvey.versionNumber + 1 : 1,
      },
    })

    return {
      id: survey.id,
      versionNumber: survey.versionNumber,
    }
  }

  private async getRedcapConfig(): Promise<{ redcapToken: string; redcapURL: string }> {
    const redcapSettings = await prisma.organisation.findFirstOrThrow({
      where: { id: 1 },
      select: { redcapToken: true, redcapURL: true },
    })

    if (!redcapSettings.redcapToken || !redcapSettings.redcapURL) {
      throw new UnprocessableError('Redcap API not configured')
    }
    return redcapSettings as any
  }

  private allFormNamesMatch(
    data: { form_name: string; [key: string]: any }[],
    formName: string,
  ): boolean {
    console.log('data', data)
    const res = data.every(
      (item: { form_name: string; [key: string]: any }) => item.form_name === formName,
    )

    console.log('res', res)

    return res
  }
}
