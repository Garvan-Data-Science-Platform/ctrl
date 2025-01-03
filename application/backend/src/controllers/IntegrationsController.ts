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

  // assumptions:
  // - passwords are strong enough (they are created in Integrations so should be strong enough)
  @Post('/redcap/participant/upload')
  @Middlewares(upload.single('file'))
  @SuccessResponse('201', 'Created Participants from CSV')
  public async uploadRedCapParticipant(@Request() request: express.Request) {
    const file = request.file
    if (!file) {
      throw new FileUploadError('No file uploaded')
    } else if (!file.buffer || file.buffer.length === 0) {
      throw new FileUploadError('File is empty')
    } else if (file.mimetype !== 'text/csv') {
      throw new FileUploadError('Invalid file type. Please upload a CSV file.')
    }

    // Create a readable stream from the buffer
    const readableStream = Readable.from(file.buffer.toString())
    const csvData: Record<string, string>[] = await parseCSV(readableStream)
    const integrationService = new Integrations(exampleREDCapMapping)
    const data: RegisterParticipantRequest[] =
      integrationService.mapCSVToParticipantRequests(csvData)

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
}
