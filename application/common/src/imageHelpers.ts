import sharp from 'sharp'
import { UnprocessableError } from '../../backend/src/middlewares/ErrorHandler'
import logger from 'common/src/logger'

export async function processLogoImage(fileBuffer: Buffer): Promise<Buffer> {
  try {
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new Error('Input buffer is empty')
    }
    return await sharp(fileBuffer)
      .resize(200)
      .png() // Convert all logo images to png
      .toBuffer()
  } catch (err: any) {
    logger.error({
      message: 'Image processing failed',
      stack: err.stack,
      sharpMessage: err.message,
    })
    throw new UnprocessableError(
      `Image processing failed: ${err.message || 'Invalid or currupted image'}`,
    )
  }
}
