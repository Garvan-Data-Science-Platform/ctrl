import { Readable } from 'stream'
import { parse } from 'fast-csv'
import * as express from 'express'
import { FileUploadError } from '../middlewares/ErrorHandler'

export async function parseCSV(stream: Readable): Promise<Record<string, string>[]> {
  const res: Record<string, string>[] = []

  return new Promise((resolve, reject) => {
    stream
      .pipe(parse({ headers: true }))
      .on('data', (data) => {
        res.push(data)
      })
      .on('error', (error) => reject(error))
      .on('end', () => resolve(res))
  })
}

export async function validateFile(request: express.Request): Promise<Express.Multer.File> {
  const file = request.file

  if (!file) {
    throw new FileUploadError('No file uploaded')
  } else if (!file.buffer || file.buffer.length === 0) {
    throw new FileUploadError('File is empty')
  } else if (file.mimetype !== 'text/csv') {
    throw new FileUploadError('Invalid file type. Please upload a CSV file.')
  }

  return file
}
