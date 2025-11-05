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
  Header,
  NoSecurity,
  Get,
  Example,
} from 'tsoa'
import { Integrations } from '../../../integrations/src/Integrations'
import prisma from '../PrismaClient'
import { Readable } from 'stream'
import { RegisterParticipantRequest } from 'common/types/api/auth'
import type {
  UploadRedcapInstrumentResponse,
  UploadRedcapInstrumentAPIRequest,
  UploadRedcapParticipantResponse,
} from 'common/types/api/integrations/redcap'
import {
  BadGatewayError,
  NotFoundError,
  UnauthorizedError,
  UnprocessableError,
} from '../middlewares/ErrorHandler'
import {
  UnauthorizedErrorResponse,
  InternalErrorResponse,
  UnprocessableErrorResponse,
} from 'common/types/api/errors'
import { GetElsaTokenResponse } from 'common/types/api/integrations/getElsaToken'
import { SurveyQuestionCheckbox, SurveyQuestionChoices, SurveyStep } from 'common/types/survey'
import REDCapMapping from '../../../integrations/src/REDCapMapping.json'
import { parseCSV, validateFile } from '../utils/parseCsv'
import { FileUploadError } from '../middlewares/ErrorHandler'
import logger from 'common/src/logger'
import { auditLog } from '../middlewares/AuditLog'
import { SurveyVersionAnswers } from '@prisma/client'
import { randomBytes } from 'crypto'
import { Prefill, Recipient } from 'common/types/invite'

interface ElsaDuosResponse {
  data: { participantId: string; duos: string[] }[]
  notFoundIds: string[]
}

@Route('/')
@Security('jwt', ['OrganisationAdmin', 'StudyAdmin'])
@Response<UnauthorizedErrorResponse>('401', 'Unauthorized')
@Response<InternalErrorResponse>('500', 'Internal Server Error')
@Response<UnprocessableErrorResponse>('422', 'Unprocessable Content')
@Tags('Integrations')
@Middlewares(auditLog)
export class IntegrationsController extends Controller {
  userRepo = prisma.user
  profileRepo = prisma.participantProfile
  surveyRepo = prisma.surveyVersion
  svaRepo = prisma.surveyVersionAnswers
  invitesRepo = prisma.invite
  integrationService = new Integrations(REDCapMapping)

  @Post('studies/{studyId}/integrations/redcap/participant/upload/csv')
  @SuccessResponse('201', 'Created Participants from CSV')
  public async uploadRedcapParticipantCSV(
    @Path() studyId: number,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadRedcapParticipantResponse> {
    // Check if study exists
    const study = await prisma.study.findUnique({
      where: { id: studyId },
    })

    if (!study) {
      throw new NotFoundError(`Study with id ${studyId} not found`)
    }

    logger.info({ message: 'This is the file that has been uploaded', file })
    await validateFile(file, []) // no required headers here so we pass none to the headers checker
    // Create a readable stream from the buffer

    const readableStream = Readable.from(file.buffer.toString())
    const csvData: Record<string, string>[] = await parseCSV(readableStream)

    return await this.processParticipantData(studyId, csvData)
  }

  @Post('studies/{studyId}/integrations/redcap/participant/upload/api')
  @SuccessResponse('201', 'Created Participants from REDCap API')
  public async uploadRedcapParticipantAPI(
    @Path() studyId: number,
  ): Promise<UploadRedcapParticipantResponse> {
    const params = new URLSearchParams()

    // Check if study exists
    const study = await prisma.study.findUnique({
      where: { id: studyId },
    })

    if (!study) {
      throw new NotFoundError(`Study with id ${studyId} not found`)
    }

    const redcapSettings = await prisma.study.findFirstOrThrow({
      where: { id: studyId },
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

  @Post('studies/{studyId}/integrations/redcap/instrument/upload/csv')
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

  @Post('studies/{studyId}/integrations/redcap/instrument/upload/api')
  @SuccessResponse('201', 'Created Survey from Redcap API')
  public async uploadRedcapInstrumentAPI(
    @Path() studyId: number,
    @Body() bodyRequest: UploadRedcapInstrumentAPIRequest,
  ): Promise<UploadRedcapInstrumentResponse> {
    const { formName } = bodyRequest

    const redcapSettings = await this.getRedcapConfig(studyId)

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

  /**
   * Provide a list of ParticipantIds and get back corresponding DUO codes
   * Requires an Elsa API key, and header "Authorization: Apikey <api-key>"
   *
   * @summary Get DUO codes for a list of ParticipantIds
   *
   * @example body {
   * "participantIds": ["PID-TYT-00000", "PID-TYT-ABC12"]
   * }
   *
   */
  @Example<ElsaDuosResponse>({
    data: [{ participantId: 'PID-TYT-00000', duos: ['DUO:0000004', 'DUO:0000018'] }],
    notFoundIds: ['PID-TYT-ABC12'],
  })
  @Post('elsa/duos')
  @NoSecurity()
  public async elsaDuos(
    @Header('Authorization') authorizationHeader: string,
    @Body() body: { participantIds: string[] },
  ): Promise<ElsaDuosResponse> {
    const headerKey = authorizationHeader.split(' ').at(1)
    const elsaKey = (await prisma.organisation.findFirstOrThrow({})).elsaToken
    if (!elsaKey || elsaKey !== headerKey) {
      throw new UnauthorizedError('Elsa API key is invalid or missing')
    }

    const res: ElsaDuosResponse = { data: [], notFoundIds: [] }

    for (const participantId of body.participantIds) {
      const p = await prisma.studyParticipant.findFirst({ where: { participantId } })
      if (!p) {
        res.notFoundIds.push(participantId)
      } else {
        const ans = await prisma.surveyVersionAnswers.findFirst({
          where: { version: { studyId: p.studyId }, profileId: p.participantProfileId },
          orderBy: { version: { versionNumber: 'desc' } },
        })
        if (!ans) {
          res.data.push({ participantId, duos: [] })
        } else {
          const duos = await this.calcDuos(ans)
          res.data.push({ participantId, duos })
        }
      }
    }

    return res
  }

  /**
   * Enable Elsa Integration
   *
   * @summary Generates a new Elsa API Key, retrieve using /elsa/token
   */
  @Post('elsa/enable')
  @Security('jwt', ['OrganisationAdmin'])
  public async elsaEnable() {
    await prisma.organisation.updateMany({
      data: { elsaToken: `ctrl-elsa-${randomBytes(32).toString('base64')}` },
    })
  }

  /**
   * Disable Elsa Integration
   *
   * @summary Disables Elsa integration and deletes API key
   */
  @Post('elsa/disable')
  @Security('jwt', ['OrganisationAdmin'])
  public async elsaDisable() {
    await prisma.organisation.updateMany({
      data: { elsaToken: null },
    })
  }

  /**
   * Get Elsa API Key
   *
   * @summary Returns Elsa API key if integration is enabled
   */
  @Get('elsa/token')
  @Security('jwt', ['OrganisationAdmin'])
  public async elsa(): Promise<GetElsaTokenResponse> {
    const token = (await prisma.organisation.findFirstOrThrow({})).elsaToken
    return { token }
  }

  private async calcDuos(ans: SurveyVersionAnswers) {
    const duos = []
    const survey = await prisma.surveyVersion.findFirstOrThrow({ where: { id: ans.versionId } })
    for (const stepIdx in survey.data) {
      const questionData = survey.data[stepIdx].elements
        .filter((val) => val.type == 'question-checkbox' || val.type == 'question-choices')
        .map((val) => val.data) as (SurveyQuestionCheckbox | SurveyQuestionChoices)[]
      for (const i in questionData) {
        for (const duo of questionData[i].duoCodes || []) {
          if (ans.answers[stepIdx].answers[i] === duo.relatedAnswer) {
            duos.push(duo.code)
          }
        }
      }
    }
    return duos
  }

  private async processParticipantData(studyId: number, rawData: Record<string, string>[]) {
    // Map REDCap data to CTRL data
    let data: RegisterParticipantRequest[] = []
    try {
      data = this.integrationService.mapRecordToParticipantRequests(rawData)
    } catch (error) {
      throw new FileUploadError(
        error instanceof Error ? error.message : 'Unknown Error: Failed to Map Data',
      )
    }

    // Process each participant - check if they exist already
    const newParticipants: Recipient[] = []
    const existingUsers: string[] = []

    for (const participant of data) {
      const { email, ...participantData } = participant

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (participantData as any).password

      // Exclude dependents and externalId from profile

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { dependents, externalId, ...profile } = participantData

      // Check if user has a participant profile associated with this study
      const user = await this.userRepo.findUnique({
        where: {
          email,
          profiles: {
            every: {
              studies: {
                every: { studyId },
              },
            },
          },
        },
      })

      // If user is already part of that study add to existingUser
      if (user) {
        existingUsers.push(email)
      } else {
        const alreadyAdded = newParticipants.some((recipient) => recipient.email === email)

        if (!alreadyAdded) {
          const prefill: Prefill = {
            profile,
            studyParticipant: { externalId },
          }
          newParticipants.push({ email, prefill })
        }
      }
    }

    return { newParticipants, existingUsers }
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

  private async getRedcapConfig(
    studyId: number,
  ): Promise<{ redcapToken: string; redcapURL: string }> {
    const redcapSettings = await prisma.study.findFirstOrThrow({
      where: { id: studyId },
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
