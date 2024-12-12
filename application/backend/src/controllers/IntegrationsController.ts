import { Post, Route, Tags, Security, Controller, SuccessResponse, Response, Request } from 'tsoa'
import { Integrations } from '../../../integrations/src/Integrations'
import exampleREDCapMapping from '../../../integrations/src/exampleREDCapMapping.json'
import prisma from '../PrismaClient'
import { createParticipant, parseCSV } from '../helperFunctions'
import { NotFoundError } from '../middlewares/ErrorHandler'
import { Readable } from 'stream'
import multer from 'multer'
import * as express from 'express'
import { UploadRedCapParticipantsResponse } from 'common/types/api/integrations/redcap'
import { RegisterParticipantRequest } from 'common/types/api/auth'
import { UnauthorizedErrorResponse, InternalErrorResponse } from 'common/types/api/errors'

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
  @SuccessResponse('200', 'Created Participants from CSV')
  public async uploadRedCapParticipant(
    @Request() request: express.Request,
  ): Promise<UploadRedCapParticipantsResponse> {
    await this.handleFile(request)
    const file = request.file

    // error checking
    if (!file) {
      throw new NotFoundError('No file uploaded')
    } else if (!file.buffer || file.buffer.length === 0) {
      throw new NotFoundError('File is empty')
    } else if (file.mimetype !== 'text/csv') {
      throw new Error('Invalid file type. Please upload a CSV file.')
    }

    // Create a readable stream from the buffer
    const readableStream = Readable.from(file.buffer.toString())
    const csvData: Record<string, string>[] = await parseCSV(readableStream)
    const integrationService = new Integrations(exampleREDCapMapping)
    const data: RegisterParticipantRequest[] =
      integrationService.mapCSVToParticipantRequests(csvData)

    const tokens = []
    for (const participant of data) {
      tokens.push(await createParticipant(participant))
    }

    return { message: `created ${tokens.length} participants` }
  }

  private handleFile(request: express.Request): Promise<void> {
    const multerSingle = multer().single('file')
    return new Promise((resolve, reject) => {
      multerSingle(request, undefined as any, async (error) => {
        if (error) {
          reject(error)
        }
        resolve()
      })
    })
  }
}
