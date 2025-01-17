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

export async function validateFile(
  request: express.Request,
  requiredHeaders: string[],
): Promise<Express.Multer.File> {
  const file = request.file

  if (!file) {
    throw new FileUploadError('No file uploaded')
  } else if (!file.buffer || file.buffer.length === 0) {
    throw new FileUploadError('File is empty')
  } else if (file.mimetype !== 'text/csv') {
    throw new FileUploadError('Invalid file type. Please upload a CSV file.')
  }

  // Check if CSV has all required headers
  const csvContent = file.buffer.toString('utf-8')
  const lines = csvContent.split('\n').filter((line) => line.trim() !== '') // Remove empty lines
  const regex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/g

  if (lines.length === 0) {
    throw new FileUploadError('CSV file is empty')
  }

  const [headerLine] = lines
  const csvHeaders = headerLine.split(regex)

  const missingHeaders = requiredHeaders.filter((header) => !csvHeaders.includes(header))

  if (missingHeaders.length > 0) {
    throw new FileUploadError(`Missing headers: ${missingHeaders.join(', ')}`)
  }

  // Check if each line has the same number of columns as the header line
  for (let i = 1; i < lines.length; i++) {
    const lineColumns = lines[i].split(regex)
    if (lineColumns.length !== csvHeaders.length) {
      throw new FileUploadError(
        `Line ${i + 1} does not have the same number of columns as the header`,
      )
    }
  }

  return file
}
