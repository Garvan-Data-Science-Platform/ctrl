import { Readable } from 'stream';
import csv from "csv-parser"
import { Post, Route, Tags, Security, Controller, Get, SuccessResponse, Response, UploadedFile } from 'tsoa'
import { Integrations } from '../../../integrations/src/Integrations';
import exampleREDCapMapping from '../../../integrations/src/exampleREDCapMapping.json';
import prisma from '../PrismaClient';
import { RegisterParticipantRequest } from 'common/types/api/auth';
import { createParticipant } from '../createParticipant';
import {UploadRedCapParticipantsResponse} from 'common/types/api/integrations/redcap'
import { NotFoundError } from '../middlewares/ErrorHandler'


@Route('integrations')
@Tags('Integrations')
@Security('jwt', ['OrganisationAdmin'])
// TODO: add response types
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
      @UploadedFile() file?: Express.Multer.File
  ): Promise<UploadRedCapParticipantsResponse> {
    console.log("HELP")
    console.log(file)
    console.log("HELP")

    if (!file || !file.buffer) {
      throw new NotFoundError("No file uploaded or file is empty.");
    }

    // Create a readable stream from the buffer
    const readableStream = Readable.from(file.buffer.toString());
    const csvData: Record<string, string>[] = await this.parseCSV(readableStream);
    const integrationService = new Integrations(exampleREDCapMapping)
    const data: RegisterParticipantRequest[] = integrationService.mapCSVToParticipantRequests(csvData)

    const tokens = []
    for (const participant of data) {
      tokens.push(await createParticipant(participant, this.userRepo, this.surveyRepo, this.profileRepo, this.spRepo))
    }

    return {message:`created ${tokens.length} participants`}
  }

  private async parseCSV(stream: Readable): Promise<Record<string, string>[]> {
    const res: Record<string, string>[] = [];

    return new Promise((resolve, reject) => {
      stream
        .pipe(csv())
        .on('data', (data) => res.push(data))
        .on('error', (error) => reject(error))
        .on('end', () => resolve(res))
    })
  }
}