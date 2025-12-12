import sharp from 'sharp'
import { UnprocessableError } from '../../backend/src/middlewares/ErrorHandler'
import logger from 'common/src/logger'

export async function processLogoImage(fileBuffer: Buffer): Promise<Buffer> {
  try {
    return await sharp(fileBuffer)
      .resize(200)
      .png() // Convert all logo images to png
      .toBuffer()
  } catch (err) {
    const errorMessage: string = 'The uploaded file is not a valid image or is corrupted'
    logger.error({ errorMessage, err })
    throw new UnprocessableError(errorMessage)
  }
}
