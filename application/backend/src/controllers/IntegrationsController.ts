import { Readable } from 'stream';
import csv from "csv-parser"
import { Post, Route, Tags, Security, Controller, Get, SuccessResponse, Response, UploadedFile } from 'tsoa'
import { Integrations } from '../../../integrations/src/Integrations';
import exampleREDCapMapping from '../../../integrations/src/exampleREDCapMapping.json';
import prisma from 'PrismaClient';
import { RegisterParticipantRequest } from 'common/types/api/auth';


@Route('integrations')
@Tags('Integrations')
@Security('jwt', ['OrganisationAdmin'])
export class IntegrationsController extends Controller {

  userRepo = prisma.user

  // assumptions:
  // - passwords are strong enough (they are created in Integrations so should be strong enough)
  @Post('/redcap/participant/upload')
  public async uploadRedCapPariticipant(
      @UploadedFile() file: Express.Multer.File
  ): Promise<{message: string}> {
    if (!file || !file.buffer) {
      throw new Error("No file uploaded or file is empty.");
    }

    // Create a readable stream from the buffer
    const readableStream = Readable.from(file.buffer.toString());

    const csvData: Record<string, string>[] = await this.parseCSV(readableStream);

    const integrationService = new Integrations(exampleREDCapMapping)

    const data: RegisterParticipantRequest[] = integrationService.mapCSVToParticipantRequests(csvData)
    console.log(data)

    return {message:"default"}
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

  //private async createParticipant(request: RegisterParticipantRequest)
}